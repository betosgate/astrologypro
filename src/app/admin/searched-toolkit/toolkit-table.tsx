"use client";

import { format } from "date-fns";
import { 
  User, 
  Calendar, 
  Mail,
  Trash2,
  Eye,
  Settings2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ToolkitTableProps {
  items: any[];
  onSelect: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

const SubjectPayload = ({ data, label, className }: { data: any, label?: string, className?: string }) => {
  if (!data || (Object.keys(data).length <= 1 && !data.dob)) return null;

  const name = data.name || data.person1?.name || label;
  const dob = data.dob;
  const tob = data.tob;
  const cityLabel = data.city?.label;

  return (
    <div className={className}>
      {name && (
        <span className="text-sm font-bold text-foreground line-clamp-1 mb-1 block">
          {name}
        </span>
      )}
      <div className="flex flex-wrap gap-1">
        {dob && (
          <div className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition-colors bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 uppercase">
            {dob} {tob ? `@ ${tob}` : ""}
          </div>
        )}
        {cityLabel && (
          <div className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold transition-colors bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 truncate max-w-[200px] uppercase">
            {cityLabel}
          </div>
        )}
      </div>
    </div>
  );
};

export function ToolkitTable({ items, onSelect, onDelete }: ToolkitTableProps) {
  return (
    <div className="rounded-md border">
      <TooltipProvider>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Tool Name</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Target / Payload</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">User Details</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wider pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const formData = item.form_data || {};
              const personName = formData.self?.name || formData.person1?.name || formData.name || "this record";

              return (
                <TableRow 
                  key={item.id} 
                  className="group transition-colors hover:bg-muted/30"
                >
                  <TableCell className="py-4">
                    <Badge variant="outline" className="font-medium bg-background whitespace-nowrap">
                      {item.toolname.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-3 max-w-[300px]">
                      {formData.self || formData.partner ? (
                        <div className="space-y-2.5">
                          <SubjectPayload data={formData.self} label="Self" />
                          {(formData.self && formData.partner) && (
                            <div className="relative h-px bg-border w-full flex items-center justify-center">
                              <span className="absolute bg-background px-2 text-[7px] text-muted-foreground uppercase font-black tracking-[0.2em]">VS</span>
                            </div>
                          )}
                          <SubjectPayload data={formData.partner} label="Partner" />
                        </div>
                      ) : formData.person1 || formData.person2 ? (
                        <div className="space-y-2.5">
                          <SubjectPayload data={formData.person1} label="Person 1" />
                          {(formData.person1 && formData.person2) && (
                            <div className="relative h-px bg-border w-full flex items-center justify-center">
                              <span className="absolute bg-background px-2 text-[7px] text-muted-foreground uppercase font-black tracking-[0.2em]">VS</span>
                            </div>
                          )}
                          <SubjectPayload data={formData.person2} label="Person 2" />
                        </div>
                      ) : (
                        <SubjectPayload data={formData} />
                      )}

                      {formData.targetMonth && !formData.self && !formData.person1 && (
                        <div className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-100 uppercase w-fit">
                           Month: {formData.targetMonth}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                         <User className="size-3 text-muted-foreground" />
                         <span>{item.user_name || "Unknown User"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                         <Mail className="size-3" />
                         <span>({item.user_email})</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>{format(new Date(item.created_at), "MMM d, yyyy · HH:mm")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-right pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => onSelect(item.id)}
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">View Details</TooltipContent>
                      </Tooltip>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                              The AI response record for <strong>{personName}</strong> will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => onDelete(item.id, personName)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  );
}
