import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  History,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "@/components/admin/store";
import { aBtn, aField, Badge, Card, Modal, PageTitle, Table, Td } from "@/components/admin/ui";
import {
  formatINR,
  formatWhatsAppDisplay,
  normalizeWhatsAppNumber,
  studio,
  waLink,
} from "@/config/studio";
import type { Quotation, QuotationRevision, QuotationStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  head: () => ({
    meta: [
      { title: "Quotations — Kahani Studio" },
      { name: "description", content: "Manage and adjust quotations for Kahani Studio." },
      { property: "og:title", content: "Quotations — Kahani Studio" },
      { property: "og:description", content: "Manage and adjust quotations for Kahani Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const statuses: QuotationStatus[] = ["Pending", "Sent", "Accepted", "Declined"];

function formatQuotationMessage(q: Quotation, finalAmount: number, notes?: string): string {
  const base = q.basePrice ?? q.estimate;
  const extras = q.additionalServicesPrice ?? 0;
  const discount = q.discount ?? 0;
  const extraCharges = q.extraCharges ?? 0;

  let msg = `✨ *${studio.name} — OFFICIAL QUOTATION* ✨\n`;
  msg += `_${studio.tagline}_\n\n`;
  msg += `Dear *${q.customer}*,\n`;
  msg += `Thank you for considering ${studio.name} for your celebration. Here is your personalized quotation:\n\n`;
  msg += `📸 *Event & Service Details:*\n`;
  msg += `• Category: ${q.category || q.packageName}\n`;
  msg += `• Package Tier: ${q.packageTier || "Selected Package"}\n`;
  msg += `• Event Date: ${q.eventDate || "Flexible / TBD"}\n`;
  msg += `• Location: ${q.location || "Studio / On-location"}\n`;
  msg += `• Duration: ${q.durationDays || 1} Day(s)\n\n`;

  if (q.addOns) {
    msg += `📦 *Additional Services Included:*\n`;
    msg += `• ${q.addOns}\n\n`;
  }

  msg += `💰 *Quotation Breakdown:*\n`;
  msg += `• Base Package Price: ${formatINR(base)}\n`;
  if (extras > 0) msg += `• Add-on Services: ${formatINR(extras)}\n`;
  if (extraCharges > 0) msg += `• Extra / Travel Charges: ${formatINR(extraCharges)}\n`;
  if (discount > 0) msg += `• Special Courtesy Discount: -${formatINR(discount)}\n`;
  msg += `─────────────────────────\n`;
  msg += `⭐ *Final Approved Quotation: ${formatINR(finalAmount)}*\n`;
  msg += `─────────────────────────\n\n`;

  if (notes) {
    msg += `📝 *Notes & Inclusions:*\n${notes}\n\n`;
  }

  msg += `We would be honored to capture your timeless story. Please reply to this message to confirm your booking dates or discuss any customizations.\n\n`;
  msg += `Warm regards,\n`;
  msg += `*${studio.name} Team*\n`;
  msg += `📞 ${studio.phone}\n`;
  msg += `✉️ ${studio.email}\n`;
  msg += `📍 ${studio.address}`;

  return msg;
}

function Page() {
  const { quotations } = useAdmin();
  const [filter, setFilter] = useState<"All" | QuotationStatus>("All");
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [printQuote, setPrintQuote] = useState<Quotation | null>(null);

  // Editable price adjustment state
  const [basePrice, setBasePrice] = useState(0);
  const [extrasPrice, setExtrasPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [extraCharges, setExtraCharges] = useState(0);
  const [manualOverride, setManualOverride] = useState<number | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [revisionNote, setRevisionNote] = useState("");

  const filtered = quotations.items.filter((item) => {
    const matchesFilter = filter === "All" || item.status === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.customer.toLowerCase().includes(q) ||
      item.phone.toLowerCase().includes(q) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      item.packageName.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalCount = quotations.items.length;
  const pendingCount = quotations.items.filter((q) => q.status === "Pending").length;
  const sentCount = quotations.items.filter((q) => q.status === "Sent").length;
  const acceptedCount = quotations.items.filter((q) => q.status === "Accepted").length;
  const totalPipelineValue = quotations.items.reduce(
    (acc, q) => acc + (q.finalQuotation ?? q.estimate),
    0,
  );

  const openAdjustModal = (q: Quotation) => {
    setSelectedQuote(q);
    setBasePrice(q.basePrice ?? q.estimate);
    setExtrasPrice(q.additionalServicesPrice ?? 0);
    setDiscount(q.discount ?? 0);
    setExtraCharges(q.extraCharges ?? 0);
    setManualOverride(
      q.finalQuotation &&
        q.finalQuotation !==
          (q.basePrice ?? q.estimate) +
            (q.additionalServicesPrice ?? 0) -
            (q.discount ?? 0) +
            (q.extraCharges ?? 0)
        ? q.finalQuotation
        : null,
    );
    setInternalNotes(q.internalNotes ?? "");
    setRevisionNote("");
    setIsAdjusting(true);
  };

  const calculatedTotal = Math.max(0, basePrice + extrasPrice + extraCharges - discount);
  const effectiveFinalAmount = manualOverride !== null ? manualOverride : calculatedTotal;

  const handleSaveAdjustments = async (newStatus?: QuotationStatus) => {
    if (!selectedQuote) return;

    const currentHistory: QuotationRevision[] = selectedQuote.history || [];
    const hasPriceChanged =
      selectedQuote.finalQuotation !== effectiveFinalAmount ||
      selectedQuote.basePrice !== basePrice ||
      selectedQuote.discount !== discount ||
      selectedQuote.extraCharges !== extraCharges;

    const newRevision: QuotationRevision | null = hasPriceChanged
      ? {
          revision: currentHistory.length + 1,
          timestamp: new Date().toISOString(),
          basePrice,
          extraServices: extrasPrice,
          discount,
          extraCharges,
          finalAmount: effectiveFinalAmount,
          note:
            revisionNote.trim() ||
            (newStatus === "Sent"
              ? "Quotation finalized and dispatched to customer"
              : "Price adjusted by admin"),
        }
      : null;

    const updatedHistory = newRevision ? [...currentHistory, newRevision] : currentHistory;
    const status = newStatus || selectedQuote.status;

    const updatedQuote: Quotation = {
      ...selectedQuote,
      status,
      basePrice,
      additionalServicesPrice: extrasPrice,
      discount,
      extraCharges,
      finalQuotation: effectiveFinalAmount,
      internalNotes,
      history: updatedHistory,
    };

    try {
      await quotations.upsert(updatedQuote);
      setSelectedQuote(updatedQuote);
      setRevisionNote("");
      toast.success("Quotation updated and saved successfully");
    } catch {
      // Error handled by store
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedQuote) return;
    const phoneToUse = selectedQuote.whatsapp || selectedQuote.phone;
    if (!phoneToUse) {
      toast.error("No phone or WhatsApp number available for this customer.");
      return;
    }

    // Save quotation with status 'Sent' before opening WhatsApp
    await handleSaveAdjustments("Sent");

    const message = formatQuotationMessage(selectedQuote, effectiveFinalAmount, internalNotes);
    const link = waLink(message, phoneToUse);

    // Open WhatsApp Click-to-Chat in new tab (admin manually hits send)
    window.open(link, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp Click-to-Chat opened. Review and press Send in WhatsApp.");
  };

  const handleCopyQuotation = () => {
    if (!selectedQuote) return;
    const message = formatQuotationMessage(selectedQuote, effectiveFinalAmount, internalNotes);
    void navigator.clipboard.writeText(message);
    toast.success("Quotation text copied to clipboard!");
  };

  const handleEmailQuotation = () => {
    if (!selectedQuote || !selectedQuote.email) {
      toast.error("No email address available for this customer.");
      return;
    }
    const subject = encodeURIComponent(
      `${studio.name} — Official Quotation for your ${selectedQuote.category || selectedQuote.packageName} Photography`,
    );
    const body = encodeURIComponent(
      formatQuotationMessage(selectedQuote, effectiveFinalAmount, internalNotes),
    );
    window.location.href = `mailto:${selectedQuote.email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <PageTitle
        title="Quotation Management"
        sub="Review, adjust prices, send via WhatsApp/Email, and track quotation history"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search quotations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={aField + " pl-8 py-1.5 text-xs w-48 sm:w-64"}
              />
            </div>
            <select
              aria-label="Filter status"
              className={aField + " w-40 py-1.5 text-xs"}
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
            >
              <option value="All">All Quotations ({totalCount})</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s} ({quotations.items.filter((q) => q.status === s).length})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Overview Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="p-4">
          <p className="text-xs font-medium text-muted-foreground">Total Quotes</p>
          <p className="mt-1 text-2xl font-bold">{totalCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Review</p>
          <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Sent to Client</p>
          <p className="mt-1 text-2xl font-bold">{sentCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Accepted</p>
          <p className="mt-1 text-2xl font-bold">{acceptedCount}</p>
        </Card>
        <Card className="col-span-2 p-4 lg:col-span-1 border-l-4 border-l-bronze">
          <p className="text-xs font-medium text-bronze">Pipeline Value</p>
          <p className="mt-1 text-xl font-bold">{formatINR(totalPipelineValue)}</p>
        </Card>
      </div>

      {/* Main Quotations Table */}
      <Table
        head={[
          "Quotation ID",
          "Customer",
          "Package / Tier",
          "Website Estimate",
          "Final Quotation",
          "Event Date",
          "Status",
          "Actions",
        ]}
      >
        {filtered.length === 0 ? (
          <tr>
            <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
              {search
                ? "No quotations match your search filter."
                : "No quotation requests received yet."}
            </td>
          </tr>
        ) : (
          filtered.map((q) => {
            const hasAdjustment = q.finalQuotation !== undefined && q.finalQuotation !== q.estimate;

            return (
              <tr key={q.id}>
                <Td className="font-mono text-xs">{q.id}</Td>
                <Td className="font-medium">
                  <p className="font-semibold text-foreground">{q.customer}</p>
                  <p className="text-xs text-muted-foreground">{q.phone}</p>
                </Td>
                <Td>
                  <p className="text-xs font-medium">{q.packageName}</p>
                  {q.addOns && (
                    <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">
                      + {q.addOns}
                    </p>
                  )}
                </Td>
                <Td className="text-xs text-muted-foreground">{formatINR(q.estimate)}</Td>
                <Td className="text-xs font-semibold">
                  <span className={hasAdjustment ? "text-bronze font-bold" : "text-foreground"}>
                    {formatINR(q.finalQuotation ?? q.estimate)}
                  </span>
                  {hasAdjustment && (
                    <span className="ml-1 inline-block rounded-xs bg-bronze/15 px-1 py-0.5 text-[9px] text-bronze uppercase">
                      Adjusted
                    </span>
                  )}
                </Td>
                <Td className="text-xs text-muted-foreground">{q.eventDate}</Td>
                <Td>
                  <select
                    aria-label="Status"
                    className="rounded-sm border border-input bg-card px-2 py-1 text-xs font-medium"
                    value={q.status}
                    onChange={(e) =>
                      quotations.upsert({
                        ...q,
                        status: e.target.value as QuotationStatus,
                      })
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <button
                    aria-label="Manage / Adjust Quotation"
                    onClick={() => openAdjustModal(q)}
                    className="inline-flex items-center gap-1 rounded-xs bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/80"
                    title="Manage & Adjust Prices"
                  >
                    <Edit3 size={13} className="text-bronze" />
                    <span>Manage</span>
                  </button>

                  <button
                    aria-label="Print or Download PDF"
                    onClick={() => setPrintQuote(q)}
                    className="ml-1 rounded-xs p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Print / PDF Quotation"
                  >
                    <Printer size={15} />
                  </button>

                  <button
                    aria-label="Delete Quotation"
                    onClick={() =>
                      confirm(`Delete quotation request for "${q.customer}"?`) &&
                      quotations.remove(q.id)
                    }
                    className="ml-1 rounded-xs p-1.5 text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </Td>
              </tr>
            );
          })
        )}
      </Table>

      {/* Quotation Adjustment Modal */}
      <Modal
        open={isAdjusting}
        onClose={() => setIsAdjusting(false)}
        title={selectedQuote ? `Quotation Management: ${selectedQuote.customer}` : "Quotation"}
      >
        {selectedQuote && (
          <div className="space-y-6 text-sm">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <span className="font-mono text-xs text-muted-foreground">
                  ID: {selectedQuote.id}
                </span>
                <p className="text-base font-bold text-foreground">{selectedQuote.packageName}</p>
                <p className="text-xs text-muted-foreground">
                  Event: {selectedQuote.eventDate} ·{" "}
                  {selectedQuote.location || "Location not specified"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge s={selectedQuote.status} />
              </div>
            </div>

            {/* Original Website Estimate vs Approved Final Banner */}
            <div className="grid gap-3 rounded-sm border border-border bg-card p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Original Website Estimate
                </p>
                <p className="mt-1 text-xl font-bold text-muted-foreground">
                  {formatINR(selectedQuote.estimate)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Calculated automatically from public packages & add-ons
                </p>
              </div>

              <div className="border-t border-border pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-bronze">
                  Approved Final Quotation
                </p>
                <p className="mt-1 text-2xl font-bold text-bronze">
                  {formatINR(effectiveFinalAmount)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Amount dispatched to customer upon approval
                </p>
              </div>
            </div>

            {/* Editable Price Adjustments */}
            <div className="rounded-sm border border-border/80 bg-muted/20 p-4">
              <h3 className="mb-3 font-serif text-base font-semibold text-foreground">
                Manual Price Adjustments & Breakdown
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Base Package Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                    className={aField + " mt-1"}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Default: {formatINR(selectedQuote.basePrice ?? selectedQuote.estimate)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Additional Services / Add-ons (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extrasPrice}
                    onChange={(e) => setExtrasPrice(Math.max(0, Number(e.target.value)))}
                    className={aField + " mt-1"}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Selected add-ons: {selectedQuote.addOns || "None"}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Special Discount / Courtesy Off (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className={aField + " mt-1 text-destructive"}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Subtracted from calculated total
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground">
                    Extra / Travel / Outstation Charges (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extraCharges}
                    onChange={(e) => setExtraCharges(Math.max(0, Number(e.target.value)))}
                    className={aField + " mt-1"}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Travel, extra hours, or destination fees
                  </span>
                </div>
              </div>

              {/* Calculated Total vs Manual Override */}
              <div className="mt-4 flex flex-wrap items-center justify-between border-t border-border pt-3">
                <div className="text-xs">
                  <span className="text-muted-foreground">Formula: </span>
                  <span className="font-mono">
                    {formatINR(basePrice)} + {formatINR(extrasPrice)} + {formatINR(extraCharges)} -{" "}
                    {formatINR(discount)}
                  </span>
                  <span className="ml-2 font-bold text-foreground">
                    = {formatINR(calculatedTotal)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualOverride !== null}
                      onChange={(e) => setManualOverride(e.target.checked ? calculatedTotal : null)}
                      className="rounded-xs accent-bronze"
                    />
                    <span>Custom Lump-Sum Override</span>
                  </label>
                  {manualOverride !== null && (
                    <input
                      type="number"
                      min={0}
                      value={manualOverride}
                      onChange={(e) => setManualOverride(Number(e.target.value))}
                      className={aField + " w-32 py-1 text-xs font-bold text-bronze"}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Internal Notes & Revision Reason */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground">
                  Internal Notes (Private to Admin)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client requested 5% discount; agreed on 2 photographers..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className={aField + " mt-1 text-xs"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground">
                  Revision Reason (Saved to History)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Added outstation travel fee for Jaipur destination..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  className={aField + " mt-1 text-xs"}
                />
              </div>
            </div>

            {/* Quotation Revision History */}
            {selectedQuote.history && selectedQuote.history.length > 0 && (
              <div className="rounded-sm border border-border bg-card p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <History size={14} className="text-bronze" />
                  <span>Quotation Revision History ({selectedQuote.history.length})</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1 text-xs">
                  {selectedQuote.history
                    .slice()
                    .reverse()
                    .map((rev) => (
                      <div
                        key={rev.revision}
                        className="flex items-center justify-between rounded-xs bg-muted/40 p-2 border border-border/40"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            Rev #{rev.revision}: {formatINR(rev.finalAmount)}
                          </span>
                          <p className="text-[11px] text-muted-foreground">
                            {rev.note || "No note recorded"}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {new Date(rev.timestamp).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Communications & Integrations Bar */}
            <div className="border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Client Communication & Actions
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Send Final Quotation on WhatsApp */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                  title="Save quotation and open WhatsApp Click-to-Chat"
                >
                  <MessageCircle size={15} />
                  <span>Send Final Quotation on WhatsApp</span>
                </button>

                {/* Email Quotation */}
                {selectedQuote.email && (
                  <button
                    type="button"
                    onClick={handleEmailQuotation}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Mail size={14} />
                    <span>Send via Email</span>
                  </button>
                )}

                {/* Copy Text */}
                <button
                  type="button"
                  onClick={handleCopyQuotation}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  <Copy size={14} />
                  <span>Copy Text</span>
                </button>

                {/* Printable View */}
                <button
                  type="button"
                  onClick={() => setPrintQuote(selectedQuote)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  <Printer size={14} />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setIsAdjusting(false)}
                className="rounded-sm border border-input px-4 py-2 text-xs font-medium hover:bg-muted"
              >
                Close
              </button>

              <div className="flex gap-2">
                <button type="button" onClick={() => handleSaveAdjustments()} className={aBtn()}>
                  <Save size={14} />
                  <span>Save Adjustments</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Printable / PDF Quotation View */}
      {printQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-white p-8 text-black shadow-2xl">
            {/* Header & Logo */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
              <div>
                <h1 className="font-serif text-3xl font-bold tracking-wider text-neutral-900">
                  {studio.name}
                </h1>
                <p className="text-xs uppercase tracking-widest text-neutral-500">
                  {studio.tagline}
                </p>
                <div className="mt-3 text-xs leading-relaxed text-neutral-600">
                  <p>{studio.address}</p>
                  <p>
                    Phone: {studio.phone} · WhatsApp: {formatWhatsAppDisplay(studio.whatsapp)}
                  </p>
                  <p>Email: {studio.email}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block rounded-xs bg-neutral-100 px-3 py-1 font-mono text-xs font-semibold text-neutral-700">
                  QUOTATION
                </span>
                <p className="mt-2 font-mono text-xs text-neutral-500">REF: {printQuote.id}</p>
                <p className="text-xs text-neutral-500">
                  Date:{" "}
                  {new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Client info */}
            <div className="my-6 grid grid-cols-2 gap-4 rounded-xs bg-neutral-50 p-4 text-xs">
              <div>
                <p className="font-semibold text-neutral-500 uppercase tracking-wider">
                  Prepared For
                </p>
                <p className="mt-1 text-sm font-bold text-neutral-900">{printQuote.customer}</p>
                <p className="text-neutral-600">Phone: {printQuote.phone}</p>
                <p className="text-neutral-600">Email: {printQuote.email || "—"}</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-500 uppercase tracking-wider">
                  Event Details
                </p>
                <p className="mt-1 font-medium text-neutral-800">
                  Category: {printQuote.category || printQuote.packageName}
                </p>
                <p className="text-neutral-600">Date: {printQuote.eventDate}</p>
                <p className="text-neutral-600">
                  Location: {printQuote.location || "Studio / On-location"}
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-300 font-semibold uppercase text-neutral-500">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-3">
                    <p className="font-semibold text-neutral-900">{printQuote.packageName}</p>
                    <p className="text-neutral-500">
                      Duration: {printQuote.durationDays || 1} Day(s) coverage
                    </p>
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatINR(printQuote.basePrice ?? printQuote.estimate)}
                  </td>
                </tr>

                {printQuote.addOns && (
                  <tr>
                    <td className="py-3">
                      <p className="font-semibold text-neutral-900">
                        Additional Services / Add-ons
                      </p>
                      <p className="text-neutral-500">{printQuote.addOns}</p>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatINR(printQuote.additionalServicesPrice ?? 0)}
                    </td>
                  </tr>
                )}

                {(printQuote.extraCharges ?? 0) > 0 && (
                  <tr>
                    <td className="py-3">
                      <p className="font-semibold text-neutral-900">Travel & Outstation Charges</p>
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatINR(printQuote.extraCharges ?? 0)}
                    </td>
                  </tr>
                )}

                {(printQuote.discount ?? 0) > 0 && (
                  <tr>
                    <td className="py-3 text-emerald-700">
                      <p className="font-semibold">Special Courtesy Discount</p>
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-700">
                      -{formatINR(printQuote.discount ?? 0)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-900 font-bold text-sm">
                  <td className="py-4 text-neutral-900">Total Approved Quotation</td>
                  <td className="py-4 text-right text-neutral-900">
                    {formatINR(printQuote.finalQuotation ?? printQuote.estimate)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Terms and conditions */}
            <div className="mt-8 border-t border-neutral-200 pt-4 text-[11px] text-neutral-500 leading-relaxed">
              <p className="font-semibold text-neutral-700">Terms & Booking Conditions:</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                <li>Booking is confirmed upon receipt of a 50% advance retainer.</li>
                <li>Dates are reserved exclusively on a first-come, first-served basis.</li>
                <li>Remaining balance is payable on or before the first day of shooting.</li>
                <li>
                  High-resolution edited frames are delivered within 4–6 weeks via private cloud
                  gallery.
                </li>
              </ul>
            </div>

            {/* Printable Modal Actions */}
            <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => setPrintQuote(null)}
                className="rounded-sm border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-sm bg-neutral-900 px-5 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
              >
                <Printer size={15} />
                <span>Print Quotation / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
