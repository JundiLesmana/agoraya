"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type GeoLevel = "province" | "regency" | "district" | "village";

interface GeoOption {
  readonly id: string;
  readonly name: string;
}

interface GeoCascadingSelectProps {
  label: string;
  name: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  value: string;
  onChange: (level: GeoLevel, id: string, name: string) => void;
}

async function fetchJson(path: string): Promise<GeoOption[]> {
  const response = await fetch(path, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const json = await response.json();
  const data = json.data ?? json ?? [];
  return Array.isArray(data) ? data : [];
}

export function GeoCascadingSelect({
  label,
  name,
  disabled = false,
  required = false,
  className,
  value,
  onChange,
}: GeoCascadingSelectProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [provinces, setProvinces] = useState<GeoOption[]>([]);
  const [regencies, setRegencies] = useState<GeoOption[]>([]);
  const [districts, setDistricts] = useState<GeoOption[]>([]);
  const [villages, setVillages] = useState<GeoOption[]>([]);
  const [provinceLoading, setProvinceLoading] = useState(true);
  const [regencyLoading, setRegencyLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false);
  const [villageLoading, setVillageLoading] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedRegency, setSelectedRegency] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadProvinces = useCallback(async () => {
    setProvinceLoading(true);
    try {
      const data = await fetchJson("/api/geo/provinces");
      setProvinces(data);
      if (!selectedProvince && data.length > 0) {
        setSelectedProvince(data[0]);
        onChangeRef.current("province", data[0].id, data[0].name);
      }
    } finally {
      setProvinceLoading(false);
    }
  }, [selectedProvince]);

  useEffect(() => {
    void loadProvinces();
  }, [loadProvinces]);

  const loadRegencies = useCallback(
    async (provinceId: string) => {
      setRegencyLoading(true);
      try {
        const data = await fetchJson(
          `/api/geo/regencies?provinceId=${encodeURIComponent(provinceId)}`,
        );
        setRegencies(data);
        setSelectedDistrict(null);
        setSelectedVillage(null);
        setDistricts([]);
        setVillages([]);
        if (data.length > 0) {
          setSelectedRegency(data[0]);
          onChangeRef.current("regency", data[0].id, data[0].name);
        } else {
          setSelectedRegency(null);
          onChangeRef.current("regency", "", "");
        }
      } finally {
        setRegencyLoading(false);
      }
    },
    [],
  );

  const loadDistricts = useCallback(
    async (regencyId: string) => {
      setDistrictLoading(true);
      try {
        const data = await fetchJson(
          `/api/geo/districts?regencyId=${encodeURIComponent(regencyId)}`,
        );
        setDistricts(data);
        setSelectedVillage(null);
        setVillages([]);
        if (data.length > 0) {
          setSelectedDistrict(data[0]);
          onChangeRef.current("district", data[0].id, data[0].name);
        } else {
          setSelectedDistrict(null);
          onChangeRef.current("district", "", "");
        }
      } finally {
        setDistrictLoading(false);
      }
    },
    [],
  );

  const loadVillages = useCallback(
    async (districtId: string) => {
      setVillageLoading(true);
      try {
        const data = await fetchJson(
          `/api/geo/villages?districtId=${encodeURIComponent(districtId)}`,
        );
        setVillages(data);
        if (data.length > 0) {
          setSelectedVillage(data[0]);
          onChangeRef.current("village", data[0].id, data[0].name);
        } else {
          setSelectedVillage(null);
          onChangeRef.current("village", "", "");
        }
      } finally {
        setVillageLoading(false);
      }
    },
    [],
  );

  const handleProvinceChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const id = event.target.value;
      const option = provinces.find((p) => p.id === id);
      setSelectedRegency(null);
      setSelectedDistrict(null);
      setSelectedVillage(null);
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      if (option) {
        setSelectedProvince(option);
        onChangeRef.current("province", option.id, option.name);
        void loadRegencies(option.id);
      } else {
        setSelectedProvince(null);
        onChangeRef.current("province", "", "");
      }
    },
    [provinces, loadRegencies],
  );

  const handleRegencyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const id = event.target.value;
      const option = regencies.find((r) => r.id === id);
      setSelectedDistrict(null);
      setSelectedVillage(null);
      setDistricts([]);
      setVillages([]);
      if (option) {
        setSelectedRegency(option);
        onChangeRef.current("regency", option.id, option.name);
        void loadDistricts(option.id);
      } else {
        setSelectedRegency(null);
        onChangeRef.current("regency", "", "");
      }
    },
    [regencies, loadDistricts],
  );

  const handleDistrictChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const id = event.target.value;
      const option = districts.find((d) => d.id === id);
      setSelectedVillage(null);
      setVillages([]);
      if (option) {
        setSelectedDistrict(option);
        onChangeRef.current("district", option.id, option.name);
        void loadVillages(option.id);
      } else {
        setSelectedDistrict(null);
        onChangeRef.current("district", "", "");
      }
    },
    [districts, loadVillages],
  );

  const handleVillageChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const id = event.target.value;
      const option = villages.find((v) => v.id === id);
      if (option) {
        setSelectedVillage(option);
        onChangeRef.current("village", option.id, option.name);
      } else {
        setSelectedVillage(null);
        onChangeRef.current("village", "", "");
      }
    },
    [villages],
  );

  const selectLevel = (level: GeoLevel) => {
    switch (level) {
      case "province":
        return selectedProvince;
      case "regency":
        return selectedRegency;
      case "district":
        return selectedDistrict;
      case "village":
        return selectedVillage;
    }
  };

  const selectOptions = (level: GeoLevel) => {
    switch (level) {
      case "province":
        return provinces;
      case "regency":
        return regencies;
      case "district":
        return districts;
      case "village":
        return villages;
    }
  };

  const selectLoading = (level: GeoLevel) => {
    switch (level) {
      case "province":
        return provinceLoading;
      case "regency":
        return regencyLoading;
      case "district":
        return districtLoading;
      case "village":
        return villageLoading;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={name}>{label} *</Label>
      <select
        id={name}
        name={name}
        disabled={disabled || selectLoading("province")}
        required={required}
        defaultValue={selectLevel("province")?.id || ""}
        onChange={handleProvinceChange}
        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <option value="">Pilih provinsi</option>
        {provinces.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <select
        id={`${name}-regency`}
        name={`${name}-regency`}
        disabled={disabled || !selectedProvince || selectLoading("regency")}
        required={required}
        defaultValue={selectLevel("regency")?.id || ""}
        onChange={handleRegencyChange}
        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <option value="">Pilih kabupaten/kota</option>
        {regencies.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <select
        id={`${name}-district`}
        name={`${name}-district`}
        disabled={disabled || !selectedRegency || selectLoading("district")}
        required={required}
        defaultValue={selectLevel("district")?.id || ""}
        onChange={handleDistrictChange}
        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <option value="">Pilih kecamatan</option>
        {districts.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>

      <select
        id={`${name}-village`}
        name={`${name}-village`}
        disabled={disabled || !selectedDistrict || selectLoading("village")}
        required={required}
        defaultValue={selectLevel("village")?.id || ""}
        onChange={handleVillageChange}
        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
      >
        <option value="">Pilih kelurahan/desa</option>
        {villages.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}
