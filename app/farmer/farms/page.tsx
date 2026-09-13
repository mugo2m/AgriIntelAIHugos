"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Option = {
  id: number;
  name: string;
  code?: string | null;
};

type Farm = {
  id: number;
  farmName: string;
  acreage: number;
  latitude: number | null;
  longitude: number | null;
  ownershipType: string | null;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  wardId: number | null;
  villageId: number | null;
  soilTypeId: number | null;
  waterSourceId: number | null;
  country?: Option | null;
  county?: Option | null;
  subCounty?: Option | null;
  ward?: Option | null;
  village?: Option | null;
  soilType?: Option | null;
  waterSource?: Option | null;
};

type FarmForm = {
  farmName: string;
  acreage: string;
  ownershipType: string;
  countryId: string;
  countyId: string;
  subCountyId: string;
  wardId: string;
  villageId: string;
  soilTypeId: string;
  waterSourceId: string;
  latitude: string;
  longitude: string;
};

const emptyForm: FarmForm = {
  farmName: "",
  acreage: "",
  ownershipType: "",
  countryId: "",
  countyId: "",
  subCountyId: "",
  wardId: "",
  villageId: "",
  soilTypeId: "",
  waterSourceId: "",
  latitude: "",
  longitude: "",
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [countries, setCountries] = useState<Option[]>([]);
  const [counties, setCounties] = useState<Option[]>([]);
  const [subCounties, setSubCounties] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);
  const [villages, setVillages] = useState<Option[]>([]);
  const [soilTypes, setSoilTypes] = useState<Option[]>([]);
  const [waterSources, setWaterSources] = useState<Option[]>([]);

  const [form, setForm] = useState<FarmForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const totalAcreage = useMemo(
    () => farms.reduce((sum, farm) => sum + Number(farm.acreage || 0), 0),
    [farms],
  );

  async function loadFarms() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/farms", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load farms.");
      }

      setFarms(Array.isArray(data?.farms) ? data.farms : []);
    } catch (err) {
      console.error("Failed to load farms:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load farms.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCountries() {
    const response = await fetch("/api/locations/countries");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to load countries.");
    }

    setCountries(Array.isArray(data) ? data : []);
  }

  async function loadSoilTypes() {
    try {
      const response = await fetch("/api/soil-types");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setSoilTypes(Array.isArray(data) ? data : []);
    } catch {
      setSoilTypes([]);
    }
  }

  async function loadWaterSources() {
    try {
      const response = await fetch("/api/water-sources");

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setWaterSources(Array.isArray(data) ? data : []);
    } catch {
      setWaterSources([]);
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingForm(true);

        await Promise.all([
          loadFarms(),
          loadCountries(),
          loadSoilTypes(),
          loadWaterSources(),
        ]);
      } catch (err) {
        console.error("Failed to load farm management data:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load farm management data.",
        );
      } finally {
        setLoadingForm(false);
      }
    }

    loadInitialData();
  }, []);

  async function handleCountryChange(countryId: string) {
    setForm((current) => ({
      ...current,
      countryId,
      countyId: "",
      subCountyId: "",
      wardId: "",
      villageId: "",
    }));

    setCounties([]);
    setSubCounties([]);
    setWards([]);
    setVillages([]);

    if (!countryId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/locations/counties?countryId=${countryId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load counties.");
      }

      setCounties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load counties.",
      );
    }
  }

  async function handleCountyChange(countyId: string) {
    setForm((current) => ({
      ...current,
      countyId,
      subCountyId: "",
      wardId: "",
      villageId: "",
    }));

    setSubCounties([]);
    setWards([]);
    setVillages([]);

    if (!countyId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/locations/subcounties?countyId=${countyId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load sub-counties.");
      }

      setSubCounties(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sub-counties.",
      );
    }
  }

  async function handleSubCountyChange(subCountyId: string) {
    setForm((current) => ({
      ...current,
      subCountyId,
      wardId: "",
      villageId: "",
    }));

    setWards([]);
    setVillages([]);

    if (!subCountyId || !form.countyId) {
      return;
    }

    /*
     * The current Ward API requires countyId, subCountyId
     * and constituencyId.
     *
     * Farm Management will therefore use the existing
     * constituency hierarchy only after we add the
     * constituency selector.
     *
     * For now, wards are loaded through the county/sub-county
     * endpoint below when available.
     */

    try {
      const response = await fetch(
        `/api/locations/wards?countyId=${form.countyId}&subCountyId=${subCountyId}&constituencyId=${subCountyId}`,
      );

      const data = await response.json();

      if (!response.ok) {
        setWards([]);
        return;
      }

      setWards(Array.isArray(data) ? data : []);
    } catch {
      setWards([]);
    }
  }

  async function handleWardChange(wardId: string) {
    setForm((current) => ({
      ...current,
      wardId,
      villageId: "",
    }));

    setVillages([]);

    if (!wardId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/locations/villages?wardId=${wardId}`,
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setVillages(Array.isArray(data) ? data : []);
    } catch {
      setVillages([]);
    }
  }

  function updateField(
    field: keyof FarmForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.farmName.trim()) {
      setError("Farm name is required.");
      return;
    }

    if (!form.acreage || Number(form.acreage) <= 0) {
      setError("Acreage must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmName: form.farmName.trim(),
          acreage: Number(form.acreage),
          ownershipType: form.ownershipType || null,
          countryId: form.countryId
            ? Number(form.countryId)
            : null,
          countyId: form.countyId
            ? Number(form.countyId)
            : null,
          subCountyId: form.subCountyId
            ? Number(form.subCountyId)
            : null,
          wardId: form.wardId
            ? Number(form.wardId)
            : null,
          villageId: form.villageId
            ? Number(form.villageId)
            : null,
          soilTypeId: form.soilTypeId
            ? Number(form.soilTypeId)
            : null,
          waterSourceId: form.waterSourceId
            ? Number(form.waterSourceId)
            : null,
          latitude: form.latitude
            ? Number(form.latitude)
            : null,
          longitude: form.longitude
            ? Number(form.longitude)
            : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to create farm.",
        );
      }

      setMessage("Farm added successfully.");
      setForm(emptyForm);

      setCounties([]);
      setSubCounties([]);
      setWards([]);
      setVillages([]);

      await loadFarms();

      setShowForm(false);
    } catch (err) {
      console.error("Failed to create farm:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create farm.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              hugos Smart Farmer AI Beta
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              My Farms
            </h1>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Manage your farms, locations, acreage and farm information.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setMessage("");
              setError("");
              setShowForm((current) => !current);
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showForm ? "Close Form" : "+ Add Farm"}
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Registered farms
            </p>

            <p className="mt-2 text-3xl font-bold">
              {farms.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total acreage
            </p>

            <p className="mt-2 text-3xl font-bold">
              {totalAcreage.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              acres
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Farm records
            </p>

            <p className="mt-2 text-3xl font-bold">
              {farms.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              active records
            </p>
          </div>
        </div>

        {showForm && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Add New Farm
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter the details for your new farm.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Basic Farm Information
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Farm name *
                    </label>

                    <input
                      type="text"
                      value={form.farmName}
                      onChange={(event) =>
                        updateField(
                          "farmName",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. Mugo Main Farm"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Acreage *
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.acreage}
                      onChange={(event) =>
                        updateField(
                          "acreage",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. 5"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Ownership type
                    </label>

                    <select
                      value={form.ownershipType}
                      onChange={(event) =>
                        updateField(
                          "ownershipType",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select ownership
                      </option>
                      <option value="Owned">
                        Owned
                      </option>
                      <option value="Leased">
                        Leased
                      </option>
                      <option value="Rented">
                        Rented
                      </option>
                      <option value="Family">
                        Family
                      </option>
                      <option value="Community">
                        Community
                      </option>
                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Farm Location
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Country
                    </label>

                    <select
                      value={form.countryId}
                      onChange={(event) =>
                        handleCountryChange(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select country
                      </option>

                      {countries.map((country) => (
                        <option
                          key={country.id}
                          value={country.id}
                        >
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      County
                    </label>

                    <select
                      value={form.countyId}
                      onChange={(event) =>
                        handleCountyChange(
                          event.target.value,
                        )
                      }
                      disabled={!form.countryId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select county
                      </option>

                      {counties.map((county) => (
                        <option
                          key={county.id}
                          value={county.id}
                        >
                          {county.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Sub-county
                    </label>

                    <select
                      value={form.subCountyId}
                      onChange={(event) =>
                        handleSubCountyChange(
                          event.target.value,
                        )
                      }
                      disabled={!form.countyId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select sub-county
                      </option>

                      {subCounties.map((subCounty) => (
                        <option
                          key={subCounty.id}
                          value={subCounty.id}
                        >
                          {subCounty.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Ward
                    </label>

                    <select
                      value={form.wardId}
                      onChange={(event) =>
                        handleWardChange(
                          event.target.value,
                        )
                      }
                      disabled={!form.subCountyId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select ward
                      </option>

                      {wards.map((ward) => (
                        <option
                          key={ward.id}
                          value={ward.id}
                        >
                          {ward.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Village
                    </label>

                    <select
                      value={form.villageId}
                      onChange={(event) =>
                        updateField(
                          "villageId",
                          event.target.value,
                        )
                      }
                      disabled={!form.wardId}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select village
                      </option>

                      {villages.map((village) => (
                        <option
                          key={village.id}
                          value={village.id}
                        >
                          {village.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Ward selection will be fully connected to the
                  constituency hierarchy in the next refinement.
                </p>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Soil and Water
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Soil type
                    </label>

                    <select
                      value={form.soilTypeId}
                      onChange={(event) =>
                        updateField(
                          "soilTypeId",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select soil type
                      </option>

                      {soilTypes.map((soilType) => (
                        <option
                          key={soilType.id}
                          value={soilType.id}
                        >
                          {soilType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Water source
                    </label>

                    <select
                      value={form.waterSourceId}
                      onChange={(event) =>
                        updateField(
                          "waterSourceId",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">
                        Select water source
                      </option>

                      {waterSources.map((source) => (
                        <option
                          key={source.id}
                          value={source.id}
                        >
                          {source.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  GPS Coordinates
                </h3>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Latitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(event) =>
                        updateField(
                          "latitude",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. -1.2921"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Longitude
                    </label>

                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(event) =>
                        updateField(
                          "longitude",
                          event.target.value,
                        )
                      }
                      placeholder="e.g. 36.8219"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || loadingForm}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving Farm..." : "Save Farm"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Registered Farms
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your current farm records.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500">
                Loading farms...
              </p>
            </div>
          ) : farms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">
                No farms registered yet
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Add your first farm to begin managing your
                agricultural activities.
              </p>

              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Your First Farm
              </button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {farms.map((farm, index) => (
                <article
                  key={farm.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        Farm #{index + 1}
                      </p>

                      <h3 className="mt-1 text-2xl font-bold">
                        {farm.farmName}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-blue-50 px-4 py-2 text-right dark:bg-blue-950/40">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {farm.acreage}
                      </p>

                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        acres
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Country
                      </span>

                      <span className="font-medium">
                        {farm.country?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        County
                      </span>

                      <span className="font-medium">
                        {farm.county?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Sub-county
                      </span>

                      <span className="font-medium">
                        {farm.subCounty?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Ward
                      </span>

                      <span className="font-medium">
                        {farm.ward?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Village
                      </span>

                      <span className="font-medium">
                        {farm.village?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Ownership
                      </span>

                      <span className="font-medium">
                        {farm.ownershipType || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="text-slate-500">
                        Soil type
                      </span>

                      <span className="font-medium">
                        {farm.soilType?.name || "Not provided"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500">
                        Water source
                      </span>

                      <span className="font-medium">
                        {farm.waterSource?.name || "Not provided"}
                      </span>
                    </div>
                  </div>

                  {(farm.latitude !== null ||
                    farm.longitude !== null) && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950">
                      <p className="font-semibold">
                        GPS coordinates
                      </p>

                      <p className="mt-1 text-slate-500">
                        Latitude:{" "}
                        {farm.latitude ?? "Not provided"}
                      </p>

                      <p className="text-slate-500">
                        Longitude:{" "}
                        {farm.longitude ?? "Not provided"}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold opacity-50 dark:border-slate-700"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 opacity-50 dark:border-red-900"
                    >
                      Delete
                    </button>

                    <button
                      type="button"
                      disabled
                      className="rounded-xl border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-600 opacity-50 dark:border-blue-900"
                    >
                      Farm Details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}