SELECT
    sc.id,
    sc.name,
    sc."countyId",
    c.name AS county_name
FROM "SubCounty" sc
JOIN "County" c
    ON c.id = sc."countyId"
WHERE LOWER(TRIM(c.name)) = 'isiolo'
  AND LOWER(TRIM(sc.name)) = 'garbatulla'
ORDER BY sc.id;
