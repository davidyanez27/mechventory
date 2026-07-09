import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "@/UI/components/interaction";
import { Button, Input, Label } from "@/UI/components/form";
import { useAuth } from "@/hooks";
import { Pencil, Upload } from '@/UI/helpers';
import { toast } from "sonner";
import { MAX_LOGO_SIZE_BYTES, ALLOWED_IMAGE_TYPES, getErrorMessage } from "@/UI/data/constants";
import InventoryApi from "@/infrastructure/api/api-client";

// Re-encodes through canvas to strip metadata and any embedded payloads.
const sanitizeImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("Canvas not supported"));
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode image"));
    };

    img.src = url;
  });

export const UserMetaCard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, company, refreshMe } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [idType, setIdType]           = useState("");
  const [idValue, setIdValue]         = useState("");

  const openModal = () => {
    setCompanyName(company?.name ?? "");
    setIdType(company?.idType ?? "");
    setIdValue(company?.idValue ?? "");
    setIsOpen(true);
  };
  const [newLogo, setNewLogo]         = useState<string | null>(null);

  const displayLogo = newLogo ?? company?.logo ?? null;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      InventoryApi.put(`/companies/update/${company?.id}`, payload),
    onSuccess: async (_data, variables) => {
      await refreshMe();
      setNewLogo(null);
      toast.success("logo" in variables && Object.keys(variables).length <= 2
        ? "Logo updated"
        : "Company info updated"
      );
      if (!("logo" in variables && Object.keys(variables).length <= 2)) {
        setIsOpen(false);
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSave = () => {
    if (!company?.id) return;
    updateMutation.mutate({
      uuid:        company.id,
      name:        companyName.trim(),
      idType:      idType.trim(),
      idValue:     idValue.trim(),
      logo:        displayLogo,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      toast.error("Only JPEG, PNG and WebP images are allowed");
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error(`Image must be smaller than ${MAX_LOGO_SIZE_BYTES / 1024} KB`);
      return;
    }

    try {
      const sanitized = await sanitizeImage(file);
      setNewLogo(sanitized);
      updateMutation.mutate({ uuid: company!.id, logo: sanitized });
    } catch {
      toast.error("Invalid image file");
    }
  };

  return (
    <>
      <div className="p-5 border border-border rounded-2xl lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            {/* Company logo — click to change */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 overflow-hidden border border-border rounded-full flex items-center justify-center bg-muted shrink-0 group"
              title="Change logo"
            >
              {displayLogo ? (
                <img src={displayLogo} alt={company?.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground uppercase">
                  {company?.name.charAt(0) ?? "?"}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="size-5 text-white" />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Company info */}
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {company?.name ?? user?.fullName ?? "—"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {company?.idType ?? "—"}
                </p>
                {company?.idType && company.idValue && (
                  <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {company?.idValue ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors lg:inline-flex lg:w-auto"
          >
            <Pencil className="size-4" />
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-lg mx-4">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Edit Company Info
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meta-company-name">Company Name</Label>
              <Input
                id="meta-company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meta-id-type">Identifier Type</Label>
                <Input
                  id="meta-id-type"
                  type="text"
                  placeholder="e.g. EIN, NIT, VAT"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="meta-id-value">Identifier Value</Label>
                <Input
                  id="meta-id-value"
                  type="text"
                  value={idValue}
                  onChange={(e) => setIdValue(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
