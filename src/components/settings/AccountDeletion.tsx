"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { accountDeletionSchema, type AccountDeletionInput } from "@/lib/schemas/settings";
import { SettingsCard } from "./SettingsCard";
import { toast } from "sonner";

interface AccountDeletionProps {
  onDelete: (password: string) => Promise<void>;
}

export function AccountDeletion({ onDelete }: AccountDeletionProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<AccountDeletionInput>({
    resolver: zodResolver(accountDeletionSchema),
    defaultValues: {
      confirmText: "",
      password: "",
    },
  });

  const handleDelete = async (data: AccountDeletionInput) => {
    setIsDeleting(true);
    try {
      await onDelete(data.password);
      toast.success("Account deletion requested", {
        description: "Your account will be deleted shortly.",
      });
      setOpen(false);
    } catch (error) {
      console.error("Account deletion error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete account";
      toast.error("Failed to delete account", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmText = form.watch("confirmText");

  return (
    <SettingsCard
      title="Danger Zone"
      description="Irreversible and destructive actions"
      className="border-destructive"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="mt-4">
            <h5 className="font-medium">Delete Account</h5>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently delete your account and all associated data
            </p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Account...</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove
                all your data from our servers.
              </DialogDescription>
            </DialogHeader>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                • All your feeds will be unpublished
                <br />
                • Subscribers will lose access to your content
                <br />
                • Pending payouts will be forfeited
                <br />• This action is irreversible
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleDelete)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="confirmText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Type <span className="font-mono font-bold">DELETE</span> to confirm
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DELETE" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Confirm Password <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline" disabled={isDeleting}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={confirmText !== "DELETE" || isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete My Account
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </SettingsCard>
  );
}
