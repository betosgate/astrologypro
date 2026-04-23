import { TemplateForm } from "../_components/template-form";

export const metadata = { title: "New Service Template | Admin" };

export default function NewServiceTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Service Template</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Add a new service type to the master catalog
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <TemplateForm />
      </div>
    </div>
  );
}
