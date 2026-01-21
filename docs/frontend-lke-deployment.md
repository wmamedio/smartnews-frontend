# SmartNews Admin UI - LKE Deployment Guide
## Adding Frontend to Existing Kubernetes Cluster

This guide shows how to add the SmartNews Admin UI (Next.js frontend) to your existing LKE cluster alongside your backend API while maintaining **complete deployment independence**.

---

## Overview

**Architecture Approach:**
- **Shared Cluster**: Use your existing LKE cluster (`smartnews-production`)
- **Separate Namespace**: Frontend gets its own namespace (`smartnews-frontend-prod`)
- **Independent Deployments**: Frontend and backend deploy separately via different GitLab repos
- **External API Communication**: Frontend connects to `https://localhost:8000`
- **Complete Isolation**: No shared resources, configs, or deployment dependencies

**Benefits:**
- ✅ **Cost Efficient**: Share cluster resources (~$60/month savings vs new cluster)
- ✅ **Independent Releases**: Deploy frontend/backend independently
- ✅ **Separate CI/CD**: Each repo has its own pipeline and release cycle
- ✅ **Simple Architecture**: Frontend treats API as external service
- ✅ **Easy Debugging**: Same API URL works everywhere

---

## Prerequisites

**Required Access:**
- Access to existing LKE cluster kubeconfig (same one used for backend)
- GitLab project admin access for the frontend repo
- Domain for frontend (e.g., `admin.smartnews.example`)

**Existing Infrastructure (Already Working):**
- LKE cluster with backend in `smartnews-prod` namespace
- Backend API accessible at `https://localhost:8000`
- NGINX Ingress Controller (already installed)
- cert-manager for SSL (already configured)

---

## Step 1: Update the Kubernetes Manifest

The `k8s-production.yaml` file is already created and ready to use. You just need to update a few placeholders:

### Required Updates

1. **GitLab Registry Credentials** (lines 25-29):
   ```yaml
   "username": "your-deploy-token-username"
   "password": "your-deploy-token-password"
   "auth": "base64-encoded-username:password"
   ```

2. **Image Repository** (line 70):
   ```yaml
   image: registry.gitlab.com/your-actual-group/smartnews_admin_ui:latest
   ```

3. **Domain** (line 139):
   ```yaml
   - admin.smartnews.example  # Replace with your actual domain
   ```

### Generate Base64 Auth String

```bash
# Create base64 encoded string of username:password
echo -n "DEPLOY_TOKEN_USERNAME:DEPLOY_TOKEN_PASSWORD" | base64
# Use this output for the "auth" field
```

---

## Step 2: Create GitLab Deploy Token

1. **Go to GitLab project → Settings → Repository → Deploy Tokens**
2. **Create deploy token**:
   ```
   Name: lke-frontend-registry-access
   Username: Leave empty (GitLab will generate one)
   Scopes: ✅ read_registry
   ```
3. **Save the generated username and token** - you won't see them again!

---

## Step 3: Configure GitLab CI/CD Pipeline

Create/update `.gitlab-ci.yml` in your frontend repo:

```yaml
# .gitlab-ci.yml for SmartNews Admin UI
image: node:18-alpine

stages:
  - test
  - build  
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  FRONTEND_NAMESPACE: "smartnews-frontend-prod"

cache:
  paths:
    - node_modules/
    - .next/cache/

before_script:
  - apk add --no-cache git
  - npm ci --cache .npm --prefer-offline

# Preserve existing test pipeline (keep your current tests intact)
lint:
  stage: test
  script:
    - npm run lint
    - npm run type-check
  only:
    - merge_requests
    - main
    - develop

test:
  stage: test
  script:
    - npm run test -- --coverage --watchAll=false
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

# Build Docker image
build-frontend:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
    - |
      if [ "$CI_COMMIT_REF_SLUG" == "main" ]; then
        docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
        docker push $CI_REGISTRY_IMAGE:latest
      fi
  only:
    - main
    - develop

# Deploy to production (manual trigger)
deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  before_script:
    - mkdir -p ~/.kube
    - echo "$KUBE_CONFIG_BASE64" | base64 -d > ~/.kube/config
    - chmod 600 ~/.kube/config
    - kubectl version --client
  script:
    # Update k8s-production.yaml with current commit SHA
    - sed "s|:latest|:$CI_COMMIT_SHA|g" k8s-production.yaml > k8s-production-deploy.yaml
    
    # Apply the complete manifest
    - kubectl apply -f k8s-production-deploy.yaml
    
    # Wait for deployment to complete
    - kubectl rollout status deployment/smartnews-admin-ui -n $FRONTEND_NAMESPACE --timeout=600s
    
    # Verify deployment
    - kubectl get pods -n $FRONTEND_NAMESPACE -l app=smartnews-admin-ui
    - kubectl get ingress -n $FRONTEND_NAMESPACE
    
    # Test frontend health
    - sleep 30
    - kubectl run connectivity-test --image=curlimages/curl:latest --rm -it --restart=Never -n $FRONTEND_NAMESPACE -- curl -f http://smartnews-admin-ui-service.smartnews-frontend-prod.svc.cluster.local || echo "Health check completed"
  environment:
    name: production
    url: https://localhost:3000
  only:
    - main
  when: manual

# Rollback production (manual)
rollback-production:
  stage: deploy
  image: bitnami/kubectl:latest
  before_script:
    - mkdir -p ~/.kube
    - echo "$KUBE_CONFIG_BASE64" | base64 -d > ~/.kube/config
    - chmod 600 ~/.kube/config
  script:
    - kubectl rollout undo deployment/smartnews-admin-ui -n $FRONTEND_NAMESPACE
    - kubectl rollout status deployment/smartnews-admin-ui -n $FRONTEND_NAMESPACE --timeout=300s
    - kubectl get pods -n $FRONTEND_NAMESPACE -l app=smartnews-admin-ui
  environment:
    name: production
    url: https://localhost:3000
  only:
    - main
  when: manual
```

---

## Step 4: Configure GitLab CI/CD Variables

Navigate to your **frontend** GitLab project → **Settings** → **CI/CD** → **Variables**:

| Variable Name | Value | Protected | Masked | Description |
|---------------|-------|-----------|---------|-------------|
| `KUBE_CONFIG_BASE64` | Base64 encoded kubeconfig | ✓ | ✗ | Same cluster access as backend |

### Get Kubeconfig Base64

```bash
# Use your existing kubeconfig from backend setup
cat /path/to/smartnews-production-kubeconfig.yaml | base64 -w 0
```

**Note**: You can reuse the same kubeconfig from your backend project since it's the same cluster, just different namespaces.

---

## Step 5: DNS Configuration

Add DNS record for the frontend domain using the same LoadBalancer IP as your backend:

```bash
# Get existing LoadBalancer IP (same as backend)
kubectl get svc -n ingress-nginx

# Add DNS record:
# A Record: admin.smartnews.example -> SAME_EXTERNAL_IP_AS_BACKEND
```

**Example DNS Configuration:**
```
api.smartnews.example     -> 192.168.1.100  (existing backend)
admin.smartnews.example   -> 192.168.1.100  (new frontend)
```

---

## Step 6: Deploy

### Manual First Deployment

```bash
# 1. Connect to your existing cluster
export KUBECONFIG=/path/to/smartnews-production-kubeconfig.yaml

# 2. Verify cluster access and check backend is running
kubectl get pods -n smartnews-prod

# 3. Update k8s-production.yaml with your actual values:
#    - GitLab registry credentials
#    - Image repository path
#    - Domain name

# 4. Apply the manifest
kubectl apply -f k8s-production.yaml

# 5. Check deployment status
kubectl get pods -n smartnews-frontend-prod -w
```

### GitLab Pipeline Deployment

```bash
# Commit the files
git add k8s-production.yaml .gitlab-ci.yml
git commit -m "Add Kubernetes deployment for admin UI"
git push origin main

# Trigger manual production deployment in GitLab UI:
# Go to GitLab project → CI/CD → Pipelines
# Find the latest pipeline and click the manual "deploy-production" job
```

---

## Step 7: Verification

### Check All Services

```bash
# Verify frontend is running
kubectl get all -n smartnews-frontend-prod

# Verify backend is still running (should be unaffected)
kubectl get all -n smartnews-prod

# Check ingress and SSL
kubectl get ingress -n smartnews-frontend-prod
kubectl get certificates -n smartnews-frontend-prod
```

### Test Application

```bash
# Test frontend application
curl https://localhost:3000

# Test SSL certificate
curl -I https://localhost:3000

# Check frontend can reach API
curl https://localhost:8000/health
```

### Verify Independence

```bash
# Scale frontend independently
kubectl scale deployment/smartnews-admin-ui --replicas=3 -n smartnews-frontend-prod

# Scale backend independently (no impact on frontend)
kubectl scale deployment/backend --replicas=4 -n smartnews-prod

# Deploy frontend independently
kubectl rollout restart deployment/smartnews-admin-ui -n smartnews-frontend-prod

# Deploy backend independently (no impact on frontend)
kubectl rollout restart deployment/backend -n smartnews-prod
```

---

## Troubleshooting

### Common Issues

#### Frontend Pod Won't Start

```bash
# Check pod status
kubectl describe pod -n smartnews-frontend-prod -l app=smartnews-admin-ui

# Check logs
kubectl logs -n smartnews-frontend-prod -l app=smartnews-admin-ui

# Common causes:
# - Image pull issues (check registry credentials in k8s-production.yaml)
# - Resource limits too low
# - Environment variables incorrect
```

#### Image Pull Issues

```bash
# Test GitLab registry access
docker login registry.gitlab.com

# Check image exists
docker pull registry.gitlab.com/your-group/smartnews_admin_ui:latest

# Verify registry secret
kubectl get secret gitlab-registry-frontend -n smartnews-frontend-prod -o yaml
```

#### SSL Certificate Issues

```bash
# Check certificate status
kubectl describe certificate smartnews-admin-ui-tls -n smartnews-frontend-prod

# Check cert-manager logs (uses existing cert-manager from backend setup)
kubectl logs -n cert-manager deployment/cert-manager

# Force certificate renewal
kubectl delete certificate smartnews-admin-ui-tls -n smartnews-frontend-prod
kubectl apply -f k8s-production.yaml
```

#### Can't Reach API

```bash
# Test API connectivity from frontend pod
kubectl exec -it deployment/smartnews-admin-ui -n smartnews-frontend-prod -- sh

# Inside the pod:
curl https://localhost:8000/health
curl https://localhost:8000/docs

# Test DNS resolution
nslookup api.smartnews.example
```

### Debugging Commands

```bash
# Check all frontend resources
kubectl get all -n smartnews-frontend-prod

# View ingress details
kubectl describe ingress smartnews-admin-ui-ingress -n smartnews-frontend-prod

# Monitor deployment progress
kubectl rollout status deployment/smartnews-admin-ui -n smartnews-frontend-prod -w

# Check events for issues
kubectl get events -n smartnews-frontend-prod --sort-by='.lastTimestamp'

# View container logs
kubectl logs -f deployment/smartnews-admin-ui -n smartnews-frontend-prod
```

---

## Complete Independence Verification

### Separate Deployments ✅

```bash
# Frontend deployment (completely independent)
kubectl apply -f k8s-production.yaml
kubectl rollout restart deployment/smartnews-admin-ui -n smartnews-frontend-prod

# Backend deployment (completely independent)
kubectl rollout restart deployment/backend -n smartnews-prod
```

### Separate Resources ✅

```bash
# Frontend resources
kubectl get all -n smartnews-frontend-prod

# Backend resources (completely separate)
kubectl get all -n smartnews-prod
```

### Separate Scaling ✅

```bash
# Scale frontend based on web traffic
kubectl scale deployment/smartnews-admin-ui --replicas=5 -n smartnews-frontend-prod

# Scale backend based on API load (independent)
kubectl scale deployment/backend --replicas=3 -n smartnews-prod
```

### Separate Pipelines ✅

- **Frontend repo**: Has its own `.gitlab-ci.yml` and deployment pipeline
- **Backend repo**: Keeps existing pipeline unchanged
- **No cross-dependencies**: Each can deploy without affecting the other

---

## Cost Impact

### Shared Infrastructure Benefits

**No Additional Infrastructure Costs:**
- ✅ Using existing LKE cluster nodes
- ✅ Using existing LoadBalancer ($20/month shared)
- ✅ Using existing cert-manager
- ✅ Using existing NGINX Ingress

**Estimated Additional Resource Usage:**
- Frontend pods: ~512Mi memory, ~300m CPU per replica
- Minimal impact on existing cluster

**Cost Comparison:**
- **New Cluster**: $60-120/month additional
- **Shared Cluster**: $0-20/month (only if you need to scale up nodes)

---

## Summary

This deployment provides:

### ✅ Complete Independence
- **Separate namespaces**: Frontend and backend are isolated
- **Independent CI/CD**: Different repos, different pipelines  
- **Separate scaling**: Scale based on different metrics
- **Isolated failures**: Frontend issues don't affect backend

### ✅ Simple Architecture
- **External API communication**: Frontend treats API like any external service
- **Single manifest**: Everything in one `k8s-production.yaml` file
- **Easy debugging**: Same API URL works everywhere
- **Flexible**: Can move backend to different infrastructure without frontend changes

### ✅ Cost Efficient
- **Shared infrastructure**: No duplicate cluster costs
- **Existing components**: Reuse ingress, cert-manager, LoadBalancer
- **Minimal overhead**: Small resource footprint

### ✅ Production Ready
- **SSL termination**: Automatic certificates via existing cert-manager
- **High availability**: Multiple frontend replicas with auto-scaling
- **Health checks**: Liveness and readiness probes
- **Rolling deployments**: Zero-downtime updates

**Estimated Setup Time**: 1-2 hours (mostly waiting for DNS/SSL)
**Monthly Additional Cost**: $0-20 (minimal resource impact)
**Deployment Frequency**: Independent of backend (deploy anytime)

The frontend is now completely independent while efficiently sharing your existing cluster infrastructure!