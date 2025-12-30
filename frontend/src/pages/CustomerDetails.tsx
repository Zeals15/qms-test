//src/pages/CustomerDetails.tsx

import  { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { api } from "../api";
import { toast } from "react-toastify";

/* ================= TYPES ================= */

type Customer = {
  id: number;
  company_name: string;
  address?: string;
};

type Location = {
  id: number;
  location_name: string;
  gstin?: string;
  address?: string;
};

type Contact = {
  id: number;
  contact_name: string;
  phone?: string;
  email?: string;
  is_primary?: number;
};

/* ================= COMPONENT ================= */

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [contacts, setContacts] = useState<Record<number, Contact[]>>({});

  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    if (!customerId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  async function loadAll() {
    try {
      setLoading(true);

      const customers = await api.getCustomers();
      const cust = customers.find((c: any) => c.id === customerId);

      if (!cust) {
        toast.error("Customer not found");
        navigate("/customers");
        return;
      }

      setCustomer(cust);

      const locs = await api.getCustomerLocations(customerId);
      setLocations(locs);

      const contactMap: Record<number, Contact[]> = {};
      for (const loc of locs) {
        contactMap[loc.id] = await api.getCustomerContacts(loc.id);
      }
      setContacts(contactMap);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  }

  /* ================= ADD HELPERS ================= */

  async function addLocation() {
    const location_name = prompt("Enter location / plant name");
    if (!location_name) return;

    try {
      const loc = await api.addCustomerLocation(customerId, {
        location_name,
      });
      setLocations(prev => [loc, ...prev]);
      toast.success("Location added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add location");
    }
  }

  async function addContact(locationId: number) {
    const contact_name = prompt("Enter contact person name");
    if (!contact_name) return;

    try {
      const contact = await api.addCustomerContact(locationId, {
        contact_name,
        is_primary: true,
      });

      setContacts(prev => ({
        ...prev,
        [locationId]: [contact, ...(prev[locationId] || [])],
      }));

      toast.success("Contact added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add contact");
    }
  }

  /* ================= RENDER ================= */

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading customer details…</div>
      </Layout>
    );
  }

  if (!customer) return null;

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div>
          <button
            onClick={() => navigate("/customers")}
            className="text-sm text-slate-500 hover:underline mb-2"
          >
            ← Back to customers
          </button>

          <h1 className="text-2xl font-semibold">{customer.company_name}</h1>
          {customer.address && (
            <p className="text-sm text-slate-500 mt-1">{customer.address}</p>
          )}
        </div>

        {/* LOCATIONS */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Locations</h2>
            <button
              onClick={addLocation}
              className="px-3 py-1 bg-rose-500 text-white rounded-md text-sm"
            >
              + Add Location
            </button>
          </div>

          {locations.length === 0 && (
            <div className="text-sm text-slate-400">
              No locations added yet.
            </div>
          )}

          <div className="space-y-4">
            {locations.map(loc => (
              <div
                key={loc.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{loc.location_name}</div>
                    <div className="text-xs text-slate-500">
                      GSTIN: {loc.gstin || "N/A"}
                    </div>
                  </div>

                  <button
                    onClick={() => addContact(loc.id)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    + Add Contact
                  </button>
                </div>

                {/* CONTACTS */}
                <div className="pl-4 space-y-1">
                  {(contacts[loc.id] || []).map(ct => (
                    <div
                      key={ct.id}
                      className="text-sm flex items-center gap-2"
                    >
                      <span>{ct.contact_name}</span>
                      {ct.is_primary ? (
                        <span className="text-xs text-green-600">(Primary)</span>
                      ) : null}
                    </div>
                  ))}

                  {(contacts[loc.id] || []).length === 0 && (
                    <div className="text-xs text-slate-400">
                      No contacts added yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
