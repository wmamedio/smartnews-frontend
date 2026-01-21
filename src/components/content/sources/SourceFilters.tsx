"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import type { SourceType } from "@/lib/api/services/feed-sources.service";
import { AVAILABLE_SOURCE_TYPES, getSourceTypeLabel } from "@/lib/config/source-types";

export interface SourceFilterState {
  search?: string;
  source_type?: SourceType;
  is_active?: boolean;
}

interface SourceFiltersProps {
  filters: SourceFilterState;
  onFiltersChange: (filters: SourceFilterState) => void;
}

export function SourceFilters({ filters, onFiltersChange }: SourceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchInput("");
    onFiltersChange({ ...filters, search: undefined });
  };

  const setSourceType = (type: SourceType | undefined) => {
    onFiltersChange({ ...filters, source_type: type });
  };

  const setActiveStatus = (isActive: boolean | undefined) => {
    onFiltersChange({ ...filters, is_active: isActive });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({});
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.source_type ? 1 : 0) +
    (filters.is_active !== undefined ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left side - Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sources by name..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right side - Filters */}
      <div className="flex items-center gap-2">
        {/* Source Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Source Type
              {filters.source_type && (
                <Badge variant="secondary" className="ml-1">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setSourceType(undefined)}>All Types</DropdownMenuItem>
            <DropdownMenuSeparator />
            {AVAILABLE_SOURCE_TYPES.map((typeConfig) => (
              <DropdownMenuItem
                key={typeConfig.value}
                onClick={() => setSourceType(typeConfig.value)}
                className={filters.source_type === typeConfig.value ? "bg-accent" : ""}
              >
                {typeConfig.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Active Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              Status
              {filters.is_active !== undefined && (
                <Badge variant="secondary" className="ml-1">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setActiveStatus(undefined)}>
              All Sources
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setActiveStatus(true)}
              className={filters.is_active === true ? "bg-accent" : ""}
            >
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setActiveStatus(false)}
              className={filters.is_active === false ? "bg-accent" : ""}
            >
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All Filters */}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>
    </div>
  );
}
