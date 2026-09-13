"use client";

import { useEffect, useState } from "react";

type Option = {
  id: number;
  name: string;
  code?: string | null;
};

type FarmerOptions = {
  genders: Option[];
  educationLevels: Option[];
  occupations: Option[];
  maritalStatuses: Option[];
  farmerTypes: Option[];
  farmingActivities: Option[];
  languages: Option[];
  communicationPreferences: Option[];
  digitalLiteracyLevels: Option[];
};

export default function FarmerFarmForm() {
  /*
   * ---------------------------------------------------------
   * LOCATION OPTIONS
   * ---------------------------------------------------------
   */

  const [countries, setCountries] = useState<Option[]>([]);
  const [counties, setCounties] = useState<Option[]>([]);
  const [subCounties, setSubCounties] = useState<Option[]>([]);
  const [constituencies, setConstituencies] = useState<Option[]>([]);
  const [wards, setWards] = useState<Option[]>([]);

  /*
   * ---------------------------------------------------------
   * FARMER LOOKUP OPTIONS
   * ---------------------------------------------------------
   */

  const [options, setOptions] = useState<FarmerOptions>({
    genders: [],
    educationLevels: [],
    occupations: [],
    maritalStatuses: [],
    farmerTypes: [],
    farmingActivities: [],
    languages: [],
    communicationPreferences: [],
    digitalLiteracyLevels: [],
  });

  /*
   * ---------------------------------------------------------
   * PERSONAL INFORMATION
   * ---------------------------------------------------------
   */

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [genderId, setGenderId] = useState("");
  const [educationLevelId, setEducationLevelId] = useState("");
  const [occupationId, setOccupationId] = useState("");
  const [maritalStatusId, setMaritalStatusId] = useState("");

  /*
   * ---------------------------------------------------------
   * FARMER PROFILE
   * ---------------------------------------------------------
   */

  const [farmerTypeId, setFarmerTypeId] = useState("");
  const [farmingActivityId, setFarmingActivityId] = useState("");
  const [farmingExperience, setFarmingExperience] = useState("");

  const [householdSize, setHouseholdSize] = useState("");
  const [numberOfDependents, setNumberOfDependents] = useState("");
  const [numberOfFarmWorkers, setNumberOfFarmWorkers] = useState("");

  /*
   * ---------------------------------------------------------
   * FINANCIAL / AGRICULTURAL SUPPORT
   * ---------------------------------------------------------
   */

  const [hasLoan, setHasLoan] = useState("");
  const [hasDefaultedLoan, setHasDefaultedLoan] = useState("");
  const [receivesInputSubsidy, setReceivesInputSubsidy] = useState("");
  const [receivesCredit, setReceivesCredit] = useState("");

  /*
   * ---------------------------------------------------------
   * COMMUNICATION / DIGITAL PROFILE
   * ---------------------------------------------------------
   */

  const [preferredLanguageId, setPreferredLanguageId] = useState("");

  const [
    communicationPreferenceId,
    setCommunicationPreferenceId,
  ] = useState("");

  const [
    digitalLiteracyLevelId,
    setDigitalLiteracyLevelId,
  ] = useState("");

  /*
   * ---------------------------------------------------------
   * LOCATION
   * ---------------------------------------------------------
   */

  const [countryId, setCountryId] = useState("");
  const [countyId, setCountyId] = useState("");
  const [subCountyId, setSubCountyId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [wardId, setWardId] = useState("");

  /*
   * Village is currently not implemented.
   *
   * Farmer.villageId is optional in Prisma, so we do not
   * send a Village ID until a proper Village selector/API
   * is implemented.
   */

  /*
   * ---------------------------------------------------------
   * FARM INFORMATION
   * ---------------------------------------------------------
   */

  const [farmName, setFarmName] = useState("");
  const [acreage, setAcreage] = useState("");

  /*
   * ---------------------------------------------------------
   * UI STATE
   * ---------------------------------------------------------
   */

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * ---------------------------------------------------------
   * LOAD COUNTRIES
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadCountries() {
      try {
        const response = await fetch(
          "/api/locations/countries"
        );

        if (!response.ok) {
          throw new Error("Failed to load countries");
        }

        const data = await response.json();

        setCountries(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load countries.");
      }
    }

    loadCountries();
  }, []);

  /*
   * ---------------------------------------------------------
   * LOAD FARMER LOOKUP OPTIONS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadFarmerOptions() {
      try {
        setLoadingOptions(true);

        const response = await fetch(
          "/api/farmers/options"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load farmer options"
          );
        }

        const data = await response.json();

        setOptions({
          genders: data.genders ?? [],
          educationLevels: data.educationLevels ?? [],
          occupations: data.occupations ?? [],
          maritalStatuses: data.maritalStatuses ?? [],
          farmerTypes: data.farmerTypes ?? [],
          farmingActivities:
            data.farmingActivities ?? [],
          languages: data.languages ?? [],
          communicationPreferences:
            data.communicationPreferences ?? [],
          digitalLiteracyLevels:
            data.digitalLiteracyLevels ?? [],
        });
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load farmer profile options."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadFarmerOptions();
  }, []);

  /*
   * ---------------------------------------------------------
   * COUNTRY → COUNTY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setCounties([]);
    setSubCounties([]);
    setConstituencies([]);
    setWards([]);

    setCountyId("");
    setSubCountyId("");
    setConstituencyId("");
    setWardId("");

    if (!countryId) {
      return;
    }

    async function loadCounties() {
      try {
        const response = await fetch(
          `/api/locations/counties?countryId=${countryId}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load counties"
          );
        }

        const data = await response.json();

        setCounties(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load counties.");
      }
    }

    loadCounties();
  }, [countryId]);

  /*
   * ---------------------------------------------------------
   * COUNTY → SUB-COUNTY + CONSTITUENCY
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setSubCounties([]);
    setConstituencies([]);
    setWards([]);

    setSubCountyId("");
    setConstituencyId("");
    setWardId("");

    if (!countyId) {
      return;
    }

    async function loadCountyData() {
      try {
        const [
          subCountyResponse,
          constituencyResponse,
        ] = await Promise.all([
          fetch(
            `/api/locations/subcounties?countyId=${countyId}`
          ),
          fetch(
            `/api/locations/constituencies?countyId=${countyId}`
          ),
        ]);

        if (!subCountyResponse.ok) {
          throw new Error(
            "Failed to load sub-counties"
          );
        }

        if (!constituencyResponse.ok) {
          throw new Error(
            "Failed to load constituencies"
          );
        }

        const [
          subCountyData,
          constituencyData,
        ] = await Promise.all([
          subCountyResponse.json(),
          constituencyResponse.json(),
        ]);

        setSubCounties(subCountyData);
        setConstituencies(constituencyData);
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load sub-counties or constituencies."
        );
      }
    }

    loadCountyData();
  }, [countyId]);

  /*
   * ---------------------------------------------------------
   * SUB-COUNTY + CONSTITUENCY → WARDS
   * ---------------------------------------------------------
   */

  useEffect(() => {
    setWards([]);
    setWardId("");

    if (
      !countyId ||
      !subCountyId ||
      !constituencyId
    ) {
      return;
    }

    async function loadWards() {
      try {
        const response = await fetch(
          `/api/locations/wards?countyId=${countyId}&subCountyId=${subCountyId}&constituencyId=${constituencyId}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load wards"
          );
        }

        const data = await response.json();

        setWards(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load wards.");
      }
    }

    loadWards();
  }, [
    countyId,
    subCountyId,
    constituencyId,
  ]);

  /*
   * ---------------------------------------------------------
   * SUBMIT
   * ---------------------------------------------------------
   */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/farmers",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            firstName,
            lastName,
            phoneNumber,

            dateOfBirth: dateOfBirth || null,

            genderId: genderId
              ? Number(genderId)
              : null,

            educationLevelId:
              educationLevelId
                ? Number(educationLevelId)
                : null,

            occupationId: occupationId
              ? Number(occupationId)
              : null,

            maritalStatusId:
              maritalStatusId
                ? Number(maritalStatusId)
                : null,

            farmerTypeId: farmerTypeId
              ? Number(farmerTypeId)
              : null,

            farmingActivityId:
              farmingActivityId
                ? Number(farmingActivityId)
                : null,

            farmingExperience:
              farmingExperience
                ? Number(farmingExperience)
                : null,

            householdSize:
              householdSize
                ? Number(householdSize)
                : null,

            numberOfDependents:
              numberOfDependents
                ? Number(numberOfDependents)
                : null,

            numberOfFarmWorkers:
              numberOfFarmWorkers
                ? Number(numberOfFarmWorkers)
                : null,

            hasLoan:
              hasLoan === ""
                ? null
                : hasLoan === "true",

            hasDefaultedLoan:
              hasDefaultedLoan === ""
                ? null
                : hasDefaultedLoan === "true",

            receivesInputSubsidy:
              receivesInputSubsidy === ""
                ? null
                : receivesInputSubsidy === "true",

            receivesCredit:
              receivesCredit === ""
                ? null
                : receivesCredit === "true",

            preferredLanguageId:
              preferredLanguageId
                ? Number(preferredLanguageId)
                : null,

            communicationPreferenceId:
              communicationPreferenceId
                ? Number(
                    communicationPreferenceId
                  )
                : null,

            digitalLiteracyLevelId:
              digitalLiteracyLevelId
                ? Number(
                    digitalLiteracyLevelId
                  )
                : null,

            /*
             * Location
             */

            countryId: Number(countryId),

            countyId: Number(countyId),

            subCountyId: Number(subCountyId),

            constituencyId: Number(
              constituencyId
            ),

            wardId: Number(wardId),

            /*
             * Village is intentionally null.
             *
             * There is currently no Village API or
             * Village selector and the Village table
             * contains no records.
             */

            villageId: null,

            /*
             * Farm
             */

            farmName,

            acreage: Number(acreage),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Registration failed."
        );
      }

      setMessage(
        data?.message ||
          "Farmer and farm registered successfully."
      );

      /*
       * -------------------------------------------------------
       * RESET FORM
       * -------------------------------------------------------
       */

      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setDateOfBirth("");

      setGenderId("");
      setEducationLevelId("");
      setOccupationId("");
      setMaritalStatusId("");

      setFarmerTypeId("");
      setFarmingActivityId("");
      setFarmingExperience("");

      setHouseholdSize("");
      setNumberOfDependents("");
      setNumberOfFarmWorkers("");

      setHasLoan("");
      setHasDefaultedLoan("");
      setReceivesInputSubsidy("");
      setReceivesCredit("");

      setPreferredLanguageId("");
      setCommunicationPreferenceId("");
      setDigitalLiteracyLevelId("");

      setCountryId("");
      setCountyId("");
      setSubCountyId("");
      setConstituencyId("");
      setWardId("");

      setFarmName("");
      setAcreage("");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * STYLING
   * ---------------------------------------------------------
   */

  const inputClass =
    "mt-2 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-200";

  const selectClass =
    "mt-2 w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

  const labelClass =
    "text-sm font-semibold text-gray-800";

  const sectionClass =
    "overflow-hidden rounded-2xl shadow-sm";

  const headingClass =
    "border-b px-6 py-4";

  const bodyClass =
    "grid gap-5 p-6 md:grid-cols-2";

  /*
   * ---------------------------------------------------------
   * FORM
   * ---------------------------------------------------------
   */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-5xl space-y-7"
    >
      {/* =====================================================
          PERSONAL INFORMATION
          ===================================================== */}

      <section
        className={`${sectionClass} border border-blue-200 bg-blue-50`}
      >
        <div
          className={`${headingClass} border-blue-200 bg-blue-100`}
        >
          <h2 className="text-xl font-bold text-blue-900">
            Personal Information
          </h2>

          <p className="mt-1 text-sm text-blue-700">
            Enter the farmer&apos;s basic personal
            information.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="firstName"
              className={labelClass}
            >
              First Name
            </label>

            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) =>
                setFirstName(e.target.value)
              }
              className={inputClass}
              placeholder="First name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className={labelClass}
            >
              Last Name
            </label>

            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) =>
                setLastName(e.target.value)
              }
              className={inputClass}
              placeholder="Last name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className={labelClass}
            >
              Phone Number
            </label>

            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) =>
                setPhoneNumber(e.target.value)
              }
              className={inputClass}
              placeholder="+254..."
              required
            />
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className={labelClass}
            >
              Date of Birth
            </label>

            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) =>
                setDateOfBirth(e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="genderId"
              className={labelClass}
            >
              Gender
            </label>

            <select
              id="genderId"
              value={genderId}
              onChange={(e) =>
                setGenderId(e.target.value)
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select gender
              </option>

              {options.genders.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="maritalStatusId"
              className={labelClass}
            >
              Marital Status
            </label>

            <select
              id="maritalStatusId"
              value={maritalStatusId}
              onChange={(e) =>
                setMaritalStatusId(e.target.value)
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select marital status
              </option>

              {options.maritalStatuses.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="educationLevelId"
              className={labelClass}
            >
              Education Level
            </label>

            <select
              id="educationLevelId"
              value={educationLevelId}
              onChange={(e) =>
                setEducationLevelId(e.target.value)
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select education level
              </option>

              {options.educationLevels.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="occupationId"
              className={labelClass}
            >
              Occupation
            </label>

            <select
              id="occupationId"
              value={occupationId}
              onChange={(e) =>
                setOccupationId(e.target.value)
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select occupation
              </option>

              {options.occupations.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          FARMER PROFILE
          ===================================================== */}

      <section
        className={`${sectionClass} border border-purple-200 bg-purple-50`}
      >
        <div
          className={`${headingClass} border-purple-200 bg-purple-100`}
        >
          <h2 className="text-xl font-bold text-purple-900">
            Farmer Profile
          </h2>

          <p className="mt-1 text-sm text-purple-700">
            Tell us more about the farmer and their
            farming experience.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="farmerTypeId"
              className={labelClass}
            >
              Farmer Type
            </label>

            <select
              id="farmerTypeId"
              value={farmerTypeId}
              onChange={(e) =>
                setFarmerTypeId(e.target.value)
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select farmer type
              </option>

              {options.farmerTypes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="farmingActivityId"
              className={labelClass}
            >
              Farming Activity
            </label>

            <select
              id="farmingActivityId"
              value={farmingActivityId}
              onChange={(e) =>
                setFarmingActivityId(
                  e.target.value
                )
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select farming activity
              </option>

              {options.farmingActivities.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="farmingExperience"
              className={labelClass}
            >
              Farming Experience (Years)
            </label>

            <input
              id="farmingExperience"
              type="number"
              min="0"
              step="1"
              value={farmingExperience}
              onChange={(e) =>
                setFarmingExperience(
                  e.target.value
                )
              }
              className={inputClass}
              placeholder="e.g. 10"
            />
          </div>

          <div>
            <label
              htmlFor="householdSize"
              className={labelClass}
            >
              Household Size
            </label>

            <input
              id="householdSize"
              type="number"
              min="0"
              step="1"
              value={householdSize}
              onChange={(e) =>
                setHouseholdSize(e.target.value)
              }
              className={inputClass}
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label
              htmlFor="numberOfDependents"
              className={labelClass}
            >
              Number of Dependents
            </label>

            <input
              id="numberOfDependents"
              type="number"
              min="0"
              step="1"
              value={numberOfDependents}
              onChange={(e) =>
                setNumberOfDependents(
                  e.target.value
                )
              }
              className={inputClass}
              placeholder="e.g. 3"
            />
          </div>

          <div>
            <label
              htmlFor="numberOfFarmWorkers"
              className={labelClass}
            >
              Number of Farm Workers
            </label>

            <input
              id="numberOfFarmWorkers"
              type="number"
              min="0"
              step="1"
              value={numberOfFarmWorkers}
              onChange={(e) =>
                setNumberOfFarmWorkers(
                  e.target.value
                )
              }
              className={inputClass}
              placeholder="e.g. 2"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATION
          ===================================================== */}

      <section
        className={`${sectionClass} border border-green-200 bg-green-50`}
      >
        <div
          className={`${headingClass} border-green-200 bg-green-100`}
        >
          <h2 className="text-xl font-bold text-green-900">
            Location
          </h2>

          <p className="mt-1 text-sm text-green-700">
            Select the farmer&apos;s administrative
            location.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="countryId"
              className={labelClass}
            >
              Country
            </label>

            <select
              id="countryId"
              value={countryId}
              onChange={(e) =>
                setCountryId(e.target.value)
              }
              className={selectClass}
              required
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
            <label
              htmlFor="countyId"
              className={labelClass}
            >
              County
            </label>

            <select
              id="countyId"
              value={countyId}
              onChange={(e) =>
                setCountyId(e.target.value)
              }
              className={selectClass}
              disabled={!countryId}
              required
            >
              <option value="">
                {countryId
                  ? "Select county"
                  : "Select country first"}
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
            <label
              htmlFor="subCountyId"
              className={labelClass}
            >
              Sub-County
            </label>

            <select
              id="subCountyId"
              value={subCountyId}
              onChange={(e) =>
                setSubCountyId(e.target.value)
              }
              className={selectClass}
              disabled={!countyId}
              required
            >
              <option value="">
                {countyId
                  ? "Select sub-county"
                  : "Select county first"}
              </option>

              {subCounties.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="constituencyId"
              className={labelClass}
            >
              Constituency
            </label>

            <select
              id="constituencyId"
              value={constituencyId}
              onChange={(e) =>
                setConstituencyId(e.target.value)
              }
              className={selectClass}
              disabled={!countyId}
              required
            >
              <option value="">
                {countyId
                  ? "Select constituency"
                  : "Select county first"}
              </option>

              {constituencies.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="wardId"
              className={labelClass}
            >
              Ward
            </label>

            <select
              id="wardId"
              value={wardId}
              onChange={(e) =>
                setWardId(e.target.value)
              }
              className={selectClass}
              disabled={
                !subCountyId ||
                !constituencyId
              }
              required
            >
              <option value="">
                {!subCountyId
                  ? "Select sub-county first"
                  : !constituencyId
                    ? "Select constituency first"
                    : "Select ward"}
              </option>

              {wards.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              VILLAGE
              ================================================= */}

          <div>
            <label
              htmlFor="village"
              className={labelClass}
            >
              Village
            </label>

            <input
              id="village"
              type="text"
              value=""
              disabled
              className={inputClass}
              placeholder="Village selector coming soon"
            />

            <p className="mt-1 text-xs text-gray-600">
              Village is currently optional and will be
              connected to the location hierarchy later.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FARM INFORMATION
          ===================================================== */}

      <section
        className={`${sectionClass} border border-amber-200 bg-amber-50`}
      >
        <div
          className={`${headingClass} border-amber-200 bg-amber-100`}
        >
          <h2 className="text-xl font-bold text-amber-900">
            Farm Information
          </h2>

          <p className="mt-1 text-sm text-amber-700">
            Enter the basic details of the farmer&apos;s
            farm.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="farmName"
              className={labelClass}
            >
              Farm Name
            </label>

            <input
              id="farmName"
              type="text"
              value={farmName}
              onChange={(e) =>
                setFarmName(e.target.value)
              }
              className={inputClass}
              placeholder="e.g. Mugo Family Farm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="acreage"
              className={labelClass}
            >
              Acreage
            </label>

            <input
              id="acreage"
              type="number"
              min="0.01"
              step="0.01"
              value={acreage}
              onChange={(e) =>
                setAcreage(e.target.value)
              }
              className={inputClass}
              placeholder="e.g. 2.5"
              required
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          FINANCIAL AND AGRICULTURAL SUPPORT
          ===================================================== */}

      <section
        className={`${sectionClass} border border-indigo-200 bg-indigo-50`}
      >
        <div
          className={`${headingClass} border-indigo-200 bg-indigo-100`}
        >
          <h2 className="text-xl font-bold text-indigo-900">
            Financial & Agricultural Support
          </h2>

          <p className="mt-1 text-sm text-indigo-700">
            Tell us about access to agricultural finance
            and support.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="hasLoan"
              className={labelClass}
            >
              Does the farmer have a loan?
            </label>

            <select
              id="hasLoan"
              value={hasLoan}
              onChange={(e) =>
                setHasLoan(e.target.value)
              }
              className={selectClass}
            >
              <option value="">
                Select option
              </option>

              <option value="true">
                Yes
              </option>

              <option value="false">
                No
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="hasDefaultedLoan"
              className={labelClass}
            >
              Has the farmer defaulted on a loan?
            </label>

            <select
              id="hasDefaultedLoan"
              value={hasDefaultedLoan}
              onChange={(e) =>
                setHasDefaultedLoan(
                  e.target.value
                )
              }
              className={selectClass}
            >
              <option value="">
                Select option
              </option>

              <option value="true">
                Yes
              </option>

              <option value="false">
                No
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="receivesInputSubsidy"
              className={labelClass}
            >
              Receives Input Subsidy?
            </label>

            <select
              id="receivesInputSubsidy"
              value={receivesInputSubsidy}
              onChange={(e) =>
                setReceivesInputSubsidy(
                  e.target.value
                )
              }
              className={selectClass}
            >
              <option value="">
                Select option
              </option>

              <option value="true">
                Yes
              </option>

              <option value="false">
                No
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="receivesCredit"
              className={labelClass}
            >
              Receives Agricultural Credit?
            </label>

            <select
              id="receivesCredit"
              value={receivesCredit}
              onChange={(e) =>
                setReceivesCredit(
                  e.target.value
                )
              }
              className={selectClass}
            >
              <option value="">
                Select option
              </option>

              <option value="true">
                Yes
              </option>

              <option value="false">
                No
              </option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          COMMUNICATION AND DIGITAL PROFILE
          ===================================================== */}

      <section
        className={`${sectionClass} border border-cyan-200 bg-cyan-50`}
      >
        <div
          className={`${headingClass} border-cyan-200 bg-cyan-100`}
        >
          <h2 className="text-xl font-bold text-cyan-900">
            Communication & Digital Profile
          </h2>

          <p className="mt-1 text-sm text-cyan-700">
            Help us understand how best to communicate
            with the farmer.
          </p>
        </div>

        <div className={bodyClass}>
          <div>
            <label
              htmlFor="preferredLanguageId"
              className={labelClass}
            >
              Preferred Language
            </label>

            <select
              id="preferredLanguageId"
              value={preferredLanguageId}
              onChange={(e) =>
                setPreferredLanguageId(
                  e.target.value
                )
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select preferred language
              </option>

              {options.languages.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="communicationPreferenceId"
              className={labelClass}
            >
              Communication Preference
            </label>

            <select
              id="communicationPreferenceId"
              value={communicationPreferenceId}
              onChange={(e) =>
                setCommunicationPreferenceId(
                  e.target.value
                )
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select communication preference
              </option>

              {options.communicationPreferences.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="digitalLiteracyLevelId"
              className={labelClass}
            >
              Digital Literacy Level
            </label>

            <select
              id="digitalLiteracyLevelId"
              value={digitalLiteracyLevelId}
              onChange={(e) =>
                setDigitalLiteracyLevelId(
                  e.target.value
                )
              }
              className={selectClass}
              disabled={loadingOptions}
            >
              <option value="">
                Select digital literacy level
              </option>

              {options.digitalLiteracyLevels.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================
          MESSAGES
          ===================================================== */}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border-2 border-green-300 bg-green-100 px-4 py-3 font-medium text-green-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border-2 border-red-300 bg-red-100 px-4 py-3 font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {/* =====================================================
          SUBMIT
          ===================================================== */}

      <button
        type="submit"
        disabled={loading || loadingOptions}
        className="w-full rounded-xl bg-green-700 px-6 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Registering..."
          : "Register Farmer and Farm"}
      </button>
    </form>
  );
}