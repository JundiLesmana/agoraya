'use client';

import { useCallback, useState } from 'react';
import { z } from 'zod';
import { useFormContext } from '@/components/forms';
import { Form, FormField, FormInput, FormSelect, FormSubmit } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export const APBD_FORM_SCHEMA = z.strictObject({
  tahun: z
    .number({ message: 'Tahun wajib diisi' })
    .int('Tahun harus berupa angka bulat')
    .min(2020, 'Tahun minimal 2020')
    .max(2100, 'Tahun maksimal 2100'),
  satker: z.string().trim().min(1, 'Satuan kerja wajib diisi'),
  kegiatan: z.string().trim().min(1, 'Kegiatan wajib diisi'),
  pagu: z.number({ message: 'Pagu wajib diisi' }).min(0, 'Pagu tidak boleh negatif'),
  realisasi: z
    .number({ message: 'Realisasi wajib diisi' })
    .min(0, 'Realisasi tidak boleh negatif'),
  periode: z.string().trim().min(1, 'Periode pelaporan wajib dipilih'),
}).refine(
  (data) => data.realisasi <= data.pagu,
  {
    message: 'Realisasi tidak boleh melebihi pagu (konsistensi angka)',
    path: ['realisasi'],
  },
);

export type ApbdFormValues = z.infer<typeof APBD_FORM_SCHEMA>;

const DEFAULT_VALUES: ApbdFormValues = {
  tahun: new Date().getFullYear(),
  satker: '',
  kegiatan: '',
  pagu: 0,
  realisasi: 0,
  periode: 'Tahun Penuh',
};

interface ApbdInputFormProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSave: (values: ApbdFormValues) => void;
}

const PERIODE_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Jan-Mar', label: 'Jan – Mar' },
  { value: 'Apr-Jun', label: 'Apr – Jun' },
  { value: 'Jul-Sep', label: 'Jul – Sep' },
  { value: 'Okt-Des', label: 'Okt – Des' },
  { value: 'Tahun Penuh', label: 'Tahun Penuh' },
];

export function ApbdInputForm({ open, onOpenChange, onSave }: ApbdInputFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const { setError, reset, formState } = useFormContext<ApbdFormValues>();
  const isSubmitting = formState.isSubmitting;

  const handleSubmit = useCallback(
    async (values: unknown) => {
      setSaveError(null);
      const data = values as ApbdFormValues;
      const result = APBD_FORM_SCHEMA.safeParse(data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = issue.path[0];
          if (key !== undefined) {
            setError(key as keyof ApbdFormValues, { message: issue.message });
          }
        }
        return;
      }
      try {
        onSave(data);
        reset(DEFAULT_VALUES);
        onOpenChange(false);
      } catch {
        setSaveError('Gagal menyimpan data. Coba lagi.');
      }
    },
    [onSave, setError, reset, onOpenChange],
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Data APBD"
      description="Masukkan data anggaran (pagu) dan realisasi untuk satu satuan kerja."
    >
      <Form
        defaultValues={DEFAULT_VALUES}
        onSubmit={handleSubmit}
        aria-label="Form input data APBD"
      >
        <Card className="space-y-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Rincian Anggaran</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              <FormField name="tahun" label="Tahun Anggaran" required>
                <FormInput type="number" placeholder="2025" />
              </FormField>
              <FormField name="satker" label="Satuan Kerja" required>
                <FormInput placeholder="Contoh: Dinas Pekerjaan Umum" />
              </FormField>
              <FormField name="kegiatan" label="Kegiatan" required>
                <FormInput placeholder="Contoh: Pembangunan Jalan Raya" />
              </FormField>
              <FormField
                name="pagu"
                label="Pagu (trilyun rupiah)"
                required
                hint="Masukkan nilai pagu dalam satuan trilyun rupiah."
              >
                <FormInput type="number" step="0.01" placeholder="0" />
              </FormField>
              <FormField
                name="realisasi"
                label="Realisasi (trilyun rupiah)"
                required
                hint="Nilai realisasi tidak boleh melebihi pagu."
              >
                <FormInput type="number" step="0.01" placeholder="0" />
              </FormField>
              <FormField name="periode" label="Periode Pelaporan" required>
                <FormSelect placeholder="Pilih periode" options={PERIODE_OPTIONS} />
              </FormField>
              {saveError ? (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {saveError}
                </div>
              ) : null}
            </div>
          </CardContent>
          <CardFooter>
            <FormSubmit disabled={isSubmitting} loading={isSubmitting}>
              Simpan Data
            </FormSubmit>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </CardFooter>
        </Card>
      </Form>
    </Modal>
  );
}
