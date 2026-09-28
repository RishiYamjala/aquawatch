import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertCircle, LoaderCircle, Plus, Search, ShieldCheck, UserRoundPlus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "wouter";

type CustomerStatus = "active" | "inactive" | "pending";

const statusLabels: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
};

export default function CustomersDashboard() {
  const { user } = useAuth();
  const trpcUtils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerId: "", name: "", email: "", phone: "", status: "active" as CustomerStatus });
  const customersQuery = trpc.customers.list.useQuery({ search }, { enabled: user?.role === "admin" });
  const createMutation = trpc.customers.create.useMutation({
    onSuccess: async () => {
      await trpcUtils.customers.list.invalidate();
      setForm({ customerId: "", name: "", email: "", phone: "", status: "active" });
      setShowForm(false);
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate({
      customerId: form.customerId.trim(),
      name: form.name.trim(),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      status: form.status,
    });
  }

  const customers = customersQuery.data ?? [];
  const activeCount = customers.filter((customer) => customer.status === "active").length;
  const pendingCount = customers.filter((customer) => customer.status === "pending").length;

  return (
    <DashboardLayout>
      <div className="customer-admin-page">
        <header className="customer-admin-heading">
          <div>
            <span className="customer-admin-eyebrow"><ShieldCheck size={14} /> PRIVATE ADMIN WORKSPACE</span>
            <h1>Customer directory</h1>
            <p>Manage customer contact details and account status. Passwords and sign-in credentials are never stored here.</p>
          </div>
          <div className="customer-admin-account">
            <span className="customer-admin-account-icon">{user?.name?.slice(0, 1).toUpperCase() || "A"}</span>
            <span><b>{user?.name || "Administrator"}</b><small>Administrator</small></span>
          </div>
        </header>

        <section className="customer-admin-stats" aria-label="Customer directory summary">
          <article><span className="customer-stat-icon"><Users size={19} /></span><span><b>{customersQuery.isLoading ? "—" : customers.length}</b><small>Matching records</small></span></article>
          <article><span className="customer-stat-icon customer-stat-active"><ShieldCheck size={19} /></span><span><b>{customersQuery.isLoading ? "—" : activeCount}</b><small>Active in results</small></span></article>
          <article><span className="customer-stat-icon customer-stat-pending"><AlertCircle size={19} /></span><span><b>{customersQuery.isLoading ? "—" : pendingCount}</b><small>Pending in results</small></span></article>
        </section>

        <section className="customer-directory-card" aria-labelledby="customer-directory-title">
          <div className="customer-directory-toolbar">
            <div>
              <h2 id="customer-directory-title">Customer records</h2>
              <p>Only authorized administrators can load or change these records.</p>
            </div>
            <Button onClick={() => setShowForm((visible) => !visible)} className="customer-add-button">
              <Plus size={16} /> {showForm ? "Cancel" : "Add customer"}
            </Button>
          </div>

          {showForm && (
            <form className="customer-create-form" onSubmit={handleSubmit}>
              <div className="customer-form-heading"><UserRoundPlus size={17} /><div><b>Add a customer</b><small>Contact details only—never enter or store a password.</small></div></div>
              <div className="customer-form-grid">
                <label>Customer ID<Input autoComplete="off" maxLength={64} required value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} placeholder="e.g. CUST-1042" /></label>
                <label>Name<Input autoComplete="name" maxLength={255} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Customer name" /></label>
                <label>Email (optional)<Input autoComplete="email" type="email" maxLength={320} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
                <label>Phone (optional)<Input autoComplete="tel" type="tel" maxLength={32} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" /></label>
                <label>Account status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CustomerStatus })}><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option></select></label>
              </div>
              {createMutation.error && <p className="customer-form-error" role="alert"><AlertCircle size={15} />{createMutation.error.message}</p>}
              <Button type="submit" disabled={createMutation.isPending} className="customer-save-button">
                {createMutation.isPending ? <LoaderCircle size={16} className="customer-spinner" /> : <Plus size={16} />}
                {createMutation.isPending ? "Saving…" : "Save customer"}
              </Button>
            </form>
          )}

          <div className="customer-search"><Search size={16} /><Input aria-label="Search customers" type="search" maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, name, email or phone" /></div>

          {customersQuery.isLoading ? (
            <div className="customer-state" role="status"><LoaderCircle size={22} className="customer-spinner" /><span>Loading customer records…</span></div>
          ) : customersQuery.isError ? (
            <div className="customer-state customer-state-error" role="alert"><AlertCircle size={20} /><span>We couldn’t load customer records. Check the database connection and try again.</span><Button variant="outline" onClick={() => customersQuery.refetch()}>Try again</Button></div>
          ) : customers.length === 0 ? (
            <div className="customer-empty-state"><span className="customer-empty-icon"><Users size={22} /></span><h3>{search ? "No matching customers" : "No customer records yet"}</h3><p>{search ? "Try a different search term." : "Add a record or import approved customer contact data to populate this private directory. No demo records are shown."}</p>{!search && <Button variant="outline" onClick={() => setShowForm(true)}><Plus size={15} /> Add first customer</Button>}</div>
          ) : (
            <div className="customer-table-wrap">
              <table className="customer-table">
                <thead><tr><th scope="col">Customer</th><th scope="col">Contact</th><th scope="col">Status</th><th scope="col">Added</th></tr></thead>
                <tbody>{customers.map((customer) => <tr key={customer.id}>
                  <td><span className="customer-name">{customer.name}</span><span className="customer-id">{customer.customerId}</span></td>
                  <td><span className="customer-contact">{customer.email || "—"}</span><span className="customer-id">{customer.phone || "No phone provided"}</span></td>
                  <td><span className={`customer-status customer-status-${customer.status}`}><i />{statusLabels[customer.status]}</span></td>
                  <td className="customer-date">{new Date(customer.createdAt).toLocaleDateString()}</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          <footer className="customer-directory-footer"><ShieldCheck size={14} /> Customer data is served by an administrator-only backend procedure. No passwords or authentication secrets are included.</footer>
        </section>
        <Link href="/" className="customer-public-link">← Return to the public AquaWatch site</Link>
      </div>
    </DashboardLayout>
  );
}
