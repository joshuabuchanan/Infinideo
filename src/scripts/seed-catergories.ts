import { db } from "../db";
import { categories } from "../db/schema";


const categoryNames = [
     "All",
    "Music",
    "JavaScript",
    "Next.js",
    "React",
    "Tailwind CSS",
    "UI/UX",
    "Podcasts",
    "Gaming",
    "Live",
    "News",
    "Cars and vehicles",
"Comedy" ,
  "Education" ,
"Entertainment" ,
"Film and animation",
"How-to and style" ,
"News and politics" ,
"People and blogs" ,
"Pets and animals" ,
"Science and technology" ,
"Sports" ,
"Travel and events" ,
];

async function main() {
    console.log("Seeding categories...");

    try{
      const values = categoryNames.map((name) => ({ 
        name,
        description: `Videos related to ${name.toLowerCase()}`,
      }));
      await db.insert(categories).values(values).onConflictDoNothing({
        target: categories.name,
      });

      console.log("Categories seeded successfully.");
    } catch (error) {
        console.error("Error seeding categories:", error);
        process.exit(1);
    }
}

main();