import { join } from "https://deno.land/std/path/mod.ts";
import { parse } from "https://deno.land/std/encoding/csv.ts";
import { BufReader } from "https://deno.land/std/io/bufio.ts";
import { pick } from "https://deno.land/x/lodash@4.17.15-es/lodash.js";
;
async function loadPlanetData() {
    const path = join(".", "kepler_exoplanets_nasa.csv");
    const file = await Deno.open(path);
    const bufReader = new BufReader(file);
    const result = await parse(bufReader, {
        skipFirstRow: true,
        comment: "#",
    });
    Deno.close(file.rid);
    const planets = result.filter((planet) => {
        const planetaryRadius = Number(planet["koi_prad"]);
        const stellarRadius = Number(planet["koi_srad"]);
        const stellarMass = Number(planet["koi_smass"]);
        return planet["koi_disposition"] === "CONFIRMED"
            && planetaryRadius > 0.5 && planetaryRadius < 1.5
            && stellarRadius > 0.99 && stellarRadius < 1.01
            && stellarMass > 0.78 && stellarMass < 1.04;
    });
    return planets.map((planet) => {
        return pick(planet, [
            "kepler_name",
            "koi_prad",
            "koi_smass",
            "koi_srad",
            "koi_count",
            "koi_steff"
        ]);
    });
}
const newEarths = await loadPlanetData();
for (const planet of newEarths) {
    console.log(planet);
}
console.log(`${newEarths.length} habitable planets found!`);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibW9kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUN6RCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDOUQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBRTlELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxpREFBaUQsQ0FBQztBQUl0RSxDQUFDO0FBRUYsS0FBSyxVQUFVLGNBQWM7SUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO0lBRXJELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxNQUFNLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUV0QyxNQUFNLE1BQU0sR0FBRyxNQUFNLEtBQUssQ0FBQyxTQUFTLEVBQUU7UUFDcEMsWUFBWSxFQUFFLElBQUk7UUFDbEIsT0FBTyxFQUFFLEdBQUc7S0FDYixDQUFDLENBQUM7SUFHSCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVyQixNQUFNLE9BQU8sR0FBSSxNQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQzFELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDakQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBRWhELE9BQU8sTUFBTSxDQUFDLGlCQUFpQixDQUFDLEtBQUssV0FBVztlQUMzQyxlQUFlLEdBQUcsR0FBRyxJQUFJLGVBQWUsR0FBRyxHQUFHO2VBQzlDLGFBQWEsR0FBRyxJQUFJLElBQUksYUFBYSxHQUFHLElBQUk7ZUFDNUMsV0FBVyxHQUFHLElBQUksSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDO0lBQ2hELENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDNUIsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2xCLGFBQWE7WUFDYixVQUFVO1lBQ1YsV0FBVztZQUNYLFVBQVU7WUFDVixXQUFXO1lBQ1gsV0FBVztTQUNaLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sY0FBYyxFQUFFLENBQUM7QUFDekMsS0FBSyxNQUFNLE1BQU0sSUFBSSxTQUFTLEVBQUU7SUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztDQUNyQjtBQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSwyQkFBMkIsQ0FBQyxDQUFBIn0=