"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Lookup = {
  id: number;
  name: string;
  code?: string | null;
};

type Farm = {
  id: number;
  farmerId: number;
  farmName: string;
  acreage: number;
  latitude: number | null;
  longitude: number | null;
  ownershipType: string | null;
  createdAt: string;
  updatedAt: string;
  soilTypeId: number | null;
  weatherStationId: number | null;
  waterSourceId: number | null;
  tenantId: number | null;
  countryId: number | null;
  countyId: number | null;
  subCountyId: number | null;
  villageId: number | null;
  wardId: number | null;
  soilType: Lookup | null;
  waterSource: Lookup | null;
  country: Lookup | null;
  county: Lookup | null;
  subCounty: Lookup | null;
  ward: Lookup | null;
  village: Lookup | null;
};

type Farmer = {
  id: number;

  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: {
      id: number;
      name: string;
      description: string | null;
    } | null;
  };

  profile: {
    phone: string | null;
    nationalId: string | null;
    dateOfBirth: string | null;
    farmingExperience: number | null;

    gender: Lookup | null;
    educationLevel: Lookup | null;
    occupation: Lookup | null;
    maritalStatus: Lookup | null;

    farmerType: Lookup | null;
    farmingActivity: Lookup | null;

    preferredLanguage: Lookup | null;
    communicationPreference: Lookup | null;
    digitalLiteracyLevel: Lookup | null;

    householdSize: number | null;
    numberOfDependents: number | null;
    numberOfFarmWorkers: number | null;

    hasLoan: boolean | null;
    hasDefaultedLoan: boolean | null;
    receivesInputSubsidy: boolean | null;
    receivesCredit: boolean | null;
  };

  location: {
    county: Lookup | null;
    subCounty: Lookup | null;
    ward: Lookup | null;
    village: Lookup | null;
  };

  farms: Farm[];
};

type DashboardResponse = {
  success: boolean;
  error?: string;
  farmer?: Farmer;
};

function displayValue(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function yesNo(value: boolean | null) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not provided";
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">
        {displayValue(value)}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <span
        className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
          warning
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function FarmerDashboardPage() {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/farmer/dashboard",
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        const result: DashboardResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.error ||
              "Failed to load farmer dashboard.",
          );
        }

        if (!result.farmer) {
          throw new Error(
            "Farmer profile was not returned.",
          );
        }

        if (!cancelled) {
          setFarmer(result.farmer);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load farmer dashboard.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalAcreage = useMemo(() => {
    if (!farmer) {
      return 0;
    }

    return farmer.farms.reduce(
      (total, farm) =>
        total + Number(farm.acreage || 0),
      0,
    );
  }, [farmer]);

  const profileCompleteness = useMemo(() => {
    if (!farmer) {
      return 0;
    }

    const fields = [
      farmer.user.firstName,
      farmer.user.lastName,
      farmer.user.phoneNumber,
      farmer.profile.phone,
      farmer.profile.dateOfBirth,
      farmer.profile.gender,
      farmer.profile.educationLevel,
      farmer.profile.occupation,
      farmer.profile.maritalStatus,
      farmer.profile.farmerType,
      farmer.profile.farmingActivity,
      farmer.profile.farmingExperience !== null,
      farmer.profile.householdSize !== null,
      farmer.profile.numberOfDependents !== null,
      farmer.profile.numberOfFarmWorkers !== null,
      farmer.profile.preferredLanguage,
      farmer.profile.communicationPreference,
      farmer.profile.digitalLiteracyLevel,
      farmer.location.county,
      farmer.location.subCounty,
      farmer.location.ward,
      farmer.location.village,
      farmer.farms.length > 0,
    ];

    const completed = fields.filter(Boolean).length;

    return Math.round(
      (completed / fields.length) * 100,
    );
  }, [farmer]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>

            <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !farmer) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-950">
              ⚠️
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
              Unable to load dashboard
            </h1>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {error ||
                "Your farmer profile could not be loaded."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const fullName =
    farmer.user.name ||
    `${farmer.user.firstName || ""} ${
      farmer.user.lastName || ""
    }`.trim() ||
    "Farmer";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-purple-900 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
                🌾 Farmer Dashboard
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome, {fullName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Welcome to your hugos Smart Farmer AI
                dashboard. Manage your farmer profile, farms,
                agricultural information, and AI-powered
                services from one place.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  {displayValue(
                    farmer.profile.farmerType?.name,
                  )}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  {displayValue(
                    farmer.profile.farmingActivity?.name,
                  )}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                  {displayValue(
                    farmer.location.county?.name,
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ask"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg transition hover:bg-blue-50"
              >
                🤖 Ask Hugo AI
              </Link>

              <Link
                href="/farmer/register"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                👤 Update Profile
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            SUMMARY
        ========================================================= */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🌱</span>

              <span className="text-xs font-semibold text-slate-500">
                MY FARMS
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
              {farmer.farms.length}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Registered farms
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📐</span>

              <span className="text-xs font-semibold text-slate-500">
                LAND
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
              {totalAcreage}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Total acres
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🚜</span>

              <span className="text-xs font-semibold text-slate-500">
                ACTIVITY
              </span>
            </div>

            <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {displayValue(
                farmer.profile.farmingActivity?.name,
              )}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Main farming activity
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📊</span>

              <span className="text-xs font-semibold text-slate-500">
                PROFILE
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
              {profileCompleteness}%
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Profile completeness
            </p>
          </div>
        </section>

        {/* =========================================================
            PROFILE COMPLETENESS
        ========================================================= */}
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Profile completeness
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Complete your profile to help Hugo AI provide
                more personalized agricultural recommendations.
              </p>
            </div>

            <span className="text-2xl font-bold text-blue-600">
              {profileCompleteness}%
            </span>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${profileCompleteness}%`,
              }}
            />
          </div>
        </section>

        {/* =========================================================
            FARMER PROFILE
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Farmer Profile
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Personal and agricultural information.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              label="First Name"
              value={farmer.user.firstName}
            />

            <InfoCard
              label="Last Name"
              value={farmer.user.lastName}
            />

            <InfoCard
              label="Phone"
              value={farmer.profile.phone}
            />

            <InfoCard
              label="Date of Birth"
              value={formatDate(
                farmer.profile.dateOfBirth,
              )}
            />

            <InfoCard
              label="Gender"
              value={farmer.profile.gender?.name}
            />

            <InfoCard
              label="Education"
              value={
                farmer.profile.educationLevel?.name
              }
            />

            <InfoCard
              label="Occupation"
              value={farmer.profile.occupation?.name}
            />

            <InfoCard
              label="Marital Status"
              value={
                farmer.profile.maritalStatus?.name
              }
            />

            <InfoCard
              label="Farmer Type"
              value={farmer.profile.farmerType?.name}
            />

            <InfoCard
              label="Farming Activity"
              value={
                farmer.profile.farmingActivity?.name
              }
            />

            <InfoCard
              label="Farming Experience"
              value={
                farmer.profile.farmingExperience !== null
                  ? `${farmer.profile.farmingExperience} years`
                  : null
              }
            />

            <InfoCard
              label="Digital Literacy"
              value={
                farmer.profile.digitalLiteracyLevel?.name
              }
            />
          </div>
        </section>

        {/* =========================================================
            LOCATION
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              My Agricultural Location
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your registered farming location.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoCard
                label="Country"
                value="Kenya"
              />

              <InfoCard
                label="County"
                value={farmer.location.county?.name}
              />

              <InfoCard
                label="Sub-County"
                value={
                  farmer.location.subCounty?.name
                }
              />

              <InfoCard
                label="Ward"
                value={farmer.location.ward?.name}
              />

              <InfoCard
                label="Village"
                value={farmer.location.village?.name}
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            HOUSEHOLD
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Household & Farm Workforce
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Household Size"
              value={farmer.profile.householdSize}
            />

            <InfoCard
              label="Dependents"
              value={
                farmer.profile.numberOfDependents
              }
            />

            <InfoCard
              label="Farm Workers"
              value={
                farmer.profile.numberOfFarmWorkers
              }
            />
          </div>
        </section>

        {/* =========================================================
            FINANCIAL
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Financial & Agricultural Support
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your current financing and support profile.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatusCard
              label="Has Loan"
              value={yesNo(
                farmer.profile.hasLoan,
              )}
              warning={
                farmer.profile.hasLoan !== true
              }
            />

            <StatusCard
              label="Loan Default"
              value={yesNo(
                farmer.profile.hasDefaultedLoan,
              )}
              warning={
                farmer.profile.hasDefaultedLoan === true
              }
            />

            <StatusCard
              label="Input Subsidy"
              value={yesNo(
                farmer.profile.receivesInputSubsidy,
              )}
              warning={
                farmer.profile.receivesInputSubsidy !== true
              }
            />

            <StatusCard
              label="Receives Credit"
              value={yesNo(
                farmer.profile.receivesCredit,
              )}
              warning={
                farmer.profile.receivesCredit !== true
              }
            />
          </div>
        </section>

        {/* =========================================================
            COMMUNICATION
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Communication & Digital Profile
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <InfoCard
              label="Preferred Language"
              value={
                farmer.profile.preferredLanguage?.name
              }
            />

            <InfoCard
              label="Communication Preference"
              value={
                farmer.profile
                  .communicationPreference?.name
              }
            />

            <InfoCard
              label="Digital Literacy"
              value={
                farmer.profile.digitalLiteracyLevel?.name
              }
            />
          </div>
        </section>

        {/* =========================================================
            FARMS
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                My Farms
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Farms registered under your farmer profile.
              </p>
            </div>

            <span className="text-sm font-bold text-blue-600">
              {farmer.farms.length}{" "}
              {farmer.farms.length === 1
                ? "farm"
                : "farms"}
            </span>
          </div>

          {farmer.farms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-4xl">🌱</div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No farms registered
              </h3>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Register a farm to start receiving
                farm-specific agricultural insights.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {farmer.farms.map((farm) => (
                <article
                  key={farm.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="bg-gradient-to-r from-emerald-700 to-green-600 p-6 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                          Farm #{farm.id}
                        </p>

                        <h3 className="mt-1 text-2xl font-bold">
                          {farm.farmName}
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-white/15 px-4 py-3 text-center backdrop-blur">
                        <p className="text-2xl font-bold">
                          {farm.acreage}
                        </p>

                        <p className="text-xs text-emerald-100">
                          acres
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard
                        label="Country"
                        value={farm.country?.name}
                      />

                      <InfoCard
                        label="County"
                        value={farm.county?.name}
                      />

                      <InfoCard
                        label="Sub-County"
                        value={
                          farm.subCounty?.name
                        }
                      />

                      <InfoCard
                        label="Ward"
                        value={farm.ward?.name}
                      />

                      <InfoCard
                        label="Village"
                        value={farm.village?.name}
                      />

                      <InfoCard
                        label="Ownership"
                        value={farm.ownershipType}
                      />

                      <InfoCard
                        label="Soil Type"
                        value={farm.soilType?.name}
                      />

                      <InfoCard
                        label="Water Source"
                        value={
                          farm.waterSource?.name
                        }
                      />
                    </div>

                    {(farm.latitude !== null ||
                      farm.longitude !== null) && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Coordinates
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {farm.latitude ?? "—"},{" "}
                          {farm.longitude ?? "—"}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            QUICK ACTIONS
        ========================================================= */}
        <section className="mt-8 rounded-3xl bg-slate-900 p-6 text-white shadow-xl dark:bg-slate-800 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                What would you like to do?
              </h2>

              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Ask Hugo AI about crops, pests, diseases,
                fertilizer, soil, farm management, markets,
                and other agricultural questions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/ask"
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                🌾 Ask Hugo AI
              </Link>

              <Link
                href="/farmer/register"
                className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                👤 Manage Profile
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}
        <footer className="py-8 text-center text-xs text-slate-400">
          hugos Smart Farmer AI • Farmer ID{" "}
          {farmer.id}
        </footer>
      </div>
    </main>
  );
}