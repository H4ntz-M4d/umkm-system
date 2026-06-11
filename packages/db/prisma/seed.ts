import { prisma } from "../src/index";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Memulai proses seeding... ");

  await prisma.users.deleteMany({});

  const hashedPassword = await bcrypt.hash("animus-zzz", 10);

  const store = await prisma.store.create({
    data: {
      name: "Nurfa Craft Yogyakarta",
      isActive: true,
    },
  });

  const superAdmin = await prisma.users.upsert({
    where: { email: "animusZZZ@gmail.com" },
    update: {},
    create: {
      email: "animusZZZ@gmail.com",
      password: hashedPassword,
      role: "OWNER",
      isActive: true,
      storeId: store.id,
    },
  });

  console.log("✅ Seeding berhasil, admin dibuat dengan password aman.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    (await prisma.$disconnect(), process.exit(1));
  });
