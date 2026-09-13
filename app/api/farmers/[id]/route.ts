import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { authorizeFarmerAccess } from "@/lib/authorization/farmer-authorization";
import {
getAuthorizedFarmerWhere,
} from "@/lib/authorization/farmer-collection-authorization";
import prisma from "@/lib/prisma";

type RouteContext = {
params: Promise<{
id: string;
}>;
};

async function getAuthenticatedDbUser() {
const currentUser = await getCurrentUser();

if (!currentUser) {
return {
currentUser: null,
dbUser: null,
response: NextResponse.json(
{
error: "Authentication required.",
},
{
status: 401,
},
),
};
}

const firebaseUid =
typeof currentUser.id === "string"
? currentUser.id.trim()
: typeof (currentUser as { uid?: unknown }).uid ===
"string"
? (currentUser as { uid: string }).uid.trim()
: "";

if (!firebaseUid) {
return {
currentUser,
dbUser: null,
response: NextResponse.json(
{
error: "Authenticated user ID not found.",
},
{
status: 401,
},
),
};
}

const dbUser = await prisma.user.findUnique({
where: {
firebaseUid,
},
select: {
id: true,
active: true,
role: {
select: {
id: true,
name: true,
},
},
},
});

if (!dbUser) {
return {
currentUser,
dbUser: null,
response: NextResponse.json(
{
error: "PostgreSQL user account not found.",
},
{
status: 404,
},
),
};
}

if (!dbUser.active) {
return {
currentUser,
dbUser: null,
response: NextResponse.json(
{
error: "User account is inactive.",
},
{
status: 403,
},
),
};
}

return {
currentUser,
dbUser,
response: null,
};
}

function parseFarmerId(id: string): number | null {
if (!/^\d+$/.test(id)) {
return null;
}

const farmerId = Number(id);

if (!Number.isSafeInteger(farmerId) || farmerId <= 0) {
return null;
}

return farmerId;
}

function parseOptionalPositiveInt(
value: unknown,
): number | null {
if (value === undefined) {
return null;
}

if (value === null || value === "") {
return null;
}

const parsed = Number(value);

if (!Number.isSafeInteger(parsed) || parsed <= 0) {
return null;
}

return parsed;
}

async function isEffectiveGeographyAuthorized(
userId: number,
countyId: number,
subCountyId: number,
wardId: number,
): Promise<boolean> {
const authorizedWhere =
await getAuthorizedFarmerWhere(userId);

if (!authorizedWhere) {
return false;
}

const matchingFarmer = await prisma.farmer.findFirst({
where: {
AND: [
authorizedWhere,
{
countyId,
subCountyId,
wardId,
},
],
},
select: {
id: true,
},
});

return matchingFarmer !== null;
}

export async function GET(
request: NextRequest,
context: RouteContext,
) {
try {
const { id } = await context.params;

```
const farmerId = parseFarmerId(id);

if (farmerId === null) {
  return NextResponse.json(
    {
      error: "A valid farmer id is required.",
    },
    {
      status: 400,
    },
  );
}

const auth = await getAuthenticatedDbUser();

if (auth.response) {
  return auth.response;
}

const dbUser = auth.dbUser!;

const authorization =
  await authorizeFarmerAccess(
    dbUser.id,
    farmerId,
  );

if (!authorization.allowed) {
  if (authorization.reason === "NO_FARMER") {
    return NextResponse.json(
      {
        error: "Farmer not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      error: "You are not authorized to access this farmer.",
    },
    {
      status: 403,
    },
  );
}

const farmer = await prisma.farmer.findUnique({
  where: {
    id: farmerId,
  },
  include: {
    user: true,
    county: true,
    subCounty: true,
    ward: true,
    village: true,
    farms: true,
  },
});

if (!farmer) {
  return NextResponse.json(
    {
      error: "Farmer not found.",
    },
    {
      status: 404,
    },
  );
}

return NextResponse.json(farmer);
```

} catch (error) {
console.error(
"GET /api/farmers/[id] error:",
error,
);

```
return NextResponse.json(
  {
    error: "Failed to fetch farmer.",
  },
  {
    status: 500,
  },
);
```

}
}

export async function PATCH(
request: NextRequest,
context: RouteContext,
) {
try {
const { id } = await context.params;

```
const farmerId = parseFarmerId(id);

if (farmerId === null) {
  return NextResponse.json(
    {
      error: "A valid farmer id is required.",
    },
    {
      status: 400,
    },
  );
}

const auth = await getAuthenticatedDbUser();

if (auth.response) {
  return auth.response;
}

const dbUser = auth.dbUser!;

const authorization =
  await authorizeFarmerAccess(
    dbUser.id,
    farmerId,
  );

if (!authorization.allowed) {
  if (authorization.reason === "NO_FARMER") {
    return NextResponse.json(
      {
        error: "Farmer not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      error: "You are not authorized to update this farmer.",
    },
    {
      status: 403,
    },
  );
}

const body = await request.json();

if (
  body === null ||
  typeof body !== "object" ||
  Array.isArray(body)
) {
  return NextResponse.json(
    {
      error: "A valid JSON object is required.",
    },
    {
      status: 400,
    },
  );
}

const data: {
  phone?: string;
  countyId?: number;
  subCountyId?: number;
  wardId?: number;
  villageId?: number | null;
} = {};

if (body.phone !== undefined) {
  if (
    typeof body.phone !== "string" ||
    !body.phone.trim()
  ) {
    return NextResponse.json(
      {
        error: "Phone must be a non-empty string.",
      },
      {
        status: 400,
      },
    );
  }

  data.phone = body.phone.trim();
}

if (body.phoneNumber !== undefined) {
  if (
    typeof body.phoneNumber !== "string" ||
    !body.phoneNumber.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Phone number must be a non-empty string.",
      },
      {
        status: 400,
      },
    );
  }

  data.phone = body.phoneNumber.trim();
}

if (body.countyId !== undefined) {
  const countyId = parseOptionalPositiveInt(
    body.countyId,
  );

  if (countyId === null) {
    return NextResponse.json(
      {
        error:
          "countyId must be a valid positive integer.",
      },
      {
        status: 400,
      },
    );
  }

  data.countyId = countyId;
}

if (body.subCountyId !== undefined) {
  const subCountyId = parseOptionalPositiveInt(
    body.subCountyId,
  );

  if (subCountyId === null) {
    return NextResponse.json(
      {
        error:
          "subCountyId must be a valid positive integer.",
      },
      {
        status: 400,
      },
    );
  }

  data.subCountyId = subCountyId;
}

if (body.wardId !== undefined) {
  const wardId = parseOptionalPositiveInt(
    body.wardId,
  );

  if (wardId === null) {
    return NextResponse.json(
      {
        error:
          "wardId must be a valid positive integer.",
      },
      {
        status: 400,
      },
    );
  }

  data.wardId = wardId;
}

if (body.villageId !== undefined) {
  if (
    body.villageId === null ||
    body.villageId === ""
  ) {
    data.villageId = null;
  } else {
    const villageId = parseOptionalPositiveInt(
      body.villageId,
    );

    if (villageId === null) {
      return NextResponse.json(
        {
          error:
            "villageId must be a valid positive integer or null.",
        },
        {
          status: 400,
        },
      );
    }

    data.villageId = villageId;
  }
}

if (Object.keys(data).length === 0) {
  return NextResponse.json(
    {
      error: "No supported farmer fields were provided.",
    },
    {
      status: 400,
    },
  );
}

const currentFarmer =
  await prisma.farmer.findUnique({
    where: {
      id: farmerId,
    },
    select: {
      id: true,
      countyId: true,
      subCountyId: true,
      wardId: true,
      villageId: true,
    },
  });

if (!currentFarmer) {
  return NextResponse.json(
    {
      error: "Farmer not found.",
    },
    {
      status: 404,
    },
  );
}

const effectiveCountyId =
  data.countyId ?? currentFarmer.countyId;

const effectiveSubCountyId =
  data.subCountyId ??
  currentFarmer.subCountyId;

const effectiveWardId =
  data.wardId ?? currentFarmer.wardId;

const effectiveVillageId =
  data.villageId !== undefined
    ? data.villageId
    : currentFarmer.villageId;

const county = await prisma.county.findUnique({
  where: {
    id: effectiveCountyId,
  },
  select: {
    id: true,
    countryId: true,
  },
});

if (!county) {
  return NextResponse.json(
    {
      error: "County not found.",
    },
    {
      status: 400,
    },
  );
}

const subCounty =
  await prisma.subCounty.findUnique({
    where: {
      id: effectiveSubCountyId,
    },
    select: {
      id: true,
      countyId: true,
    },
  });

if (!subCounty) {
  return NextResponse.json(
    {
      error: "Sub-county not found.",
    },
    {
      status: 400,
    },
  );
}

if (subCounty.countyId !== county.id) {
  return NextResponse.json(
    {
      error:
        "Sub-county does not belong to the selected county.",
    },
    {
      status: 400,
    },
  );
}

const ward = await prisma.ward.findUnique({
  where: {
    id: effectiveWardId,
  },
  select: {
    id: true,
    countyId: true,
    subCountyId: true,
  },
});

if (!ward) {
  return NextResponse.json(
    {
      error: "Ward not found.",
    },
    {
      status: 400,
    },
  );
}

if (ward.countyId !== county.id) {
  return NextResponse.json(
    {
      error:
        "Ward does not belong to the selected county.",
    },
    {
      status: 400,
    },
  );
}

if (ward.subCountyId !== subCounty.id) {
  return NextResponse.json(
    {
      error:
        "Ward does not belong to the selected sub-county.",
    },
    {
      status: 400,
    },
  );
}

if (effectiveVillageId !== null) {
  const village =
    await prisma.village.findUnique({
      where: {
        id: effectiveVillageId,
      },
      select: {
        id: true,
        wardId: true,
      },
    });

  if (!village) {
    return NextResponse.json(
      {
        error: "Village not found.",
      },
      {
        status: 400,
      },
    );
  }

  if (village.wardId !== ward.id) {
    return NextResponse.json(
      {
        error:
          "Village does not belong to the selected ward.",
      },
      {
        status: 400,
      },
    );
  }
}

if (
  data.countyId !== undefined ||
  data.subCountyId !== undefined ||
  data.wardId !== undefined
) {
  const effectiveGeographyAuthorized =
    await isEffectiveGeographyAuthorized(
      dbUser.id,
      effectiveCountyId,
      effectiveSubCountyId,
      effectiveWardId,
    );

  if (!effectiveGeographyAuthorized) {
    return NextResponse.json(
      {
        error:
          "You are not authorized to move this farmer to the selected geographic scope.",
      },
      {
        status: 403,
      },
    );
  }
}

const farmer = await prisma.farmer.update({
  where: {
    id: farmerId,
  },
  data,
  include: {
    user: true,
    county: true,
    subCounty: true,
    ward: true,
    village: true,
    farms: true,
  },
});

return NextResponse.json(farmer);
```

} catch (error) {
console.error(
"PATCH /api/farmers/[id] error:",
error,
);

```
return NextResponse.json(
  {
    error: "Failed to update farmer.",
  },
  {
    status: 500,
  },
);
```

}
}

export async function DELETE(
request: NextRequest,
context: RouteContext,
) {
try {
const { id } = await context.params;

```
const farmerId = parseFarmerId(id);

if (farmerId === null) {
  return NextResponse.json(
    {
      error: "A valid farmer id is required.",
    },
    {
      status: 400,
    },
  );
}

const auth = await getAuthenticatedDbUser();

if (auth.response) {
  return auth.response;
}

const dbUser = auth.dbUser!;

const authorization =
  await authorizeFarmerAccess(
    dbUser.id,
    farmerId,
  );

if (!authorization.allowed) {
  if (authorization.reason === "NO_FARMER") {
    return NextResponse.json(
      {
        error: "Farmer not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json(
    {
      error: "You are not authorized to delete this farmer.",
    },
    {
      status: 403,
    },
  );
}

const farmer =
  await prisma.farmer.findUnique({
    where: {
      id: farmerId,
    },
    select: {
      id: true,
    },
  });

if (!farmer) {
  return NextResponse.json(
    {
      error: "Farmer not found.",
    },
    {
      status: 404,
    },
  );
}

await prisma.farmer.delete({
  where: {
    id: farmerId,
  },
});

return NextResponse.json({
  success: true,
  message: "Farmer deleted successfully.",
});


} catch (error) {
console.error(
"DELETE /api/farmers/[id] error:",
error,
);


return NextResponse.json(
  {
    error: "Failed to delete farmer.",
  },
  {
    status: 500,
  },
);


}
}
