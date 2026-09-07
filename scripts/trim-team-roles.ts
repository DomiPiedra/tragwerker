import { prisma } from "../src/lib/prisma";

/** Short two-line roles: title / degree on line 1, position on line 2 when needed. */
const roleByName: Record<string, string> = {
  "Dr.-Ing. Niclas Rausch": "Dr.-Ing. (TUM)\nInhaber / geschäftsführender Gesellschafter",
  "Michael Knittler": "Dipl.-Ing. (FH)\nGeschäftsführer",
  "Dr.-Ing. Martin Rausch": "Dr.-Ing. (TUM)\nInhaber / Geschäftsführer",
  "Herbert Andre": "Dipl.-Ing. (FH)",
  "Simon Kube": "M.Eng.",
  "Tinka Rausch": "Assistenz der Geschäftsleitung\nFinanzwesen",
  "Natalia Bobowska": "Mag.-Ing.",
  "Riku Eerola": "B.Eng.",
  "Hatice Geldi": "Dipl.-Ing.",
  "Finn Koriath": "Bauzeichner",
  "Florian Schmidt": "B.Eng.",
  "Peter Prennig": "Dipl.-Ing. (FH)\nBeratender Ingenieur",
  "Zbynek Badura": "Bautechniker",
};

async function main() {
  const members = await prisma.teamMember.findMany();

  for (const member of members) {
    const role = roleByName[member.name] ?? member.role.split(",")[0]?.trim() ?? member.role;
    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        role,
        bio: null,
        expertise: [],
      },
    });
    console.log(`updated: ${member.name} → ${JSON.stringify(role)}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
