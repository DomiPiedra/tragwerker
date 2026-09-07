import { prisma } from "../src/lib/prisma";

const members = [
  {
    name: "Dr.-Ing. Niclas Rausch",
    role: "Dr.-Ing. (TUM), Inhaber / geschäftsführender Gesellschafter",
    bio: "Beratender Ingenieur VBI, BYIK-Bau",
    expertise: ["Beratender Ingenieur VBI", "BYIK-Bau"],
    avatarUrl: "/uploads/media/niclasneu_min-86887791-e079ea21.jpeg",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Michael Knittler",
    role: "Dipl.-Ing. (FH), Geschäftsführer",
    bio: "Beratender Ingenieur VBI, BYIK-Bau\nEnergieberater Wohngebäude",
    expertise: ["Beratender Ingenieur VBI", "BYIK-Bau", "Energieberater Wohngebäude"],
    avatarUrl: "/uploads/media/mk_sw_kl-16c1b93a-c2a26a07.jpg",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Dr.-Ing. Martin Rausch",
    role: "Dr.-Ing. (TUM), Inhaber / Geschäftsführer",
    bio: "Beratender Ingenieur VBI, BYIK-Bau\nPrüfingenieur für Standsicherheit VPI – Fachrichtung Massivbau\nPrüfsachverständiger für Standsicherheit\nPrüfsachverständiger für baulichen und energiesparenden Wärmeschutz",
    expertise: [
      "Beratender Ingenieur VBI",
      "BYIK-Bau",
      "Prüfingenieur für Standsicherheit VPI – Massivbau",
      "Prüfsachverständiger für Standsicherheit",
      "Prüfsachverständiger für baulichen und energiesparenden Wärmeschutz",
    ],
    avatarUrl: "/uploads/media/img_0959sw_25-d076aed9-17ad7482.jpg",
    featured: true,
    sortOrder: 3,
  },
  {
    name: "Herbert Andre",
    role: "Dipl.-Ing. (FH)",
    bio: "Nachweisberechtigter für Standsicherheit\nNachweisberechtigter für Brandschutz\nEnergieberater Wohngebäude",
    expertise: [
      "Nachweisberechtigter für Standsicherheit",
      "Nachweisberechtigter für Brandschutz",
      "Energieberater Wohngebäude",
    ],
    avatarUrl: "/uploads/media/herbert-andre.jpg",
    featured: false,
    sortOrder: 10,
  },
  {
    name: "Simon Kube",
    role: "M.Eng.",
    bio: "Nachweisberechtigter für Standsicherheit",
    expertise: ["Nachweisberechtigter für Standsicherheit"],
    avatarUrl: "/uploads/media/simon-kube.jpg",
    featured: false,
    sortOrder: 11,
  },
  {
    name: "Tinka Rausch",
    role: "Assistenz der Geschäftsleitung, Finanzwesen",
    bio: null,
    expertise: ["Assistenz der Geschäftsleitung", "Finanzwesen"],
    avatarUrl: "/uploads/media/tinka-rausch.jpg",
    featured: false,
    sortOrder: 12,
  },
  {
    name: "Natalia Bobowska",
    role: "Mag.-Ing.",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/natalia-bobowska.jpg",
    featured: false,
    sortOrder: 13,
  },
  {
    name: "Riku Eerola",
    role: "B.Eng.",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/riku-eerola.jpg",
    featured: false,
    sortOrder: 14,
  },
  {
    name: "Hatice Geldi",
    role: "Dipl.-Ing.",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/hatice-geldi.jpg",
    featured: false,
    sortOrder: 15,
  },
  {
    name: "Finn Koriath",
    role: "Bauzeichner",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/finn-koriath.jpg",
    featured: false,
    sortOrder: 16,
  },
  {
    name: "Florian Schmidt",
    role: "B.Eng.",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/florian-schmidt.jpg",
    featured: false,
    sortOrder: 17,
  },
  {
    name: "Peter Prennig",
    role: "Dipl.-Ing. (FH)",
    bio: "Beratender Ingenieur",
    expertise: ["Beratender Ingenieur"],
    avatarUrl: "/uploads/media/peter-prennig.jpg",
    featured: false,
    sortOrder: 18,
  },
  {
    name: "Zbynek Badura",
    role: "Bautechniker",
    bio: null,
    expertise: [] as string[],
    avatarUrl: "/uploads/media/zbynek-badura.jpg",
    featured: false,
    sortOrder: 19,
  },
] as const;

async function main() {
  const now = new Date();

  for (const member of members) {
    const existing = await prisma.teamMember.findFirst({
      where: { name: member.name },
    });

    const data = {
      name: member.name,
      role: member.role,
      bio: member.bio,
      expertise: [...member.expertise],
      avatarUrl: member.avatarUrl,
      featured: member.featured,
      sortOrder: member.sortOrder,
      published: true,
      publishedAt: now,
    };

    if (existing) {
      await prisma.teamMember.update({ where: { id: existing.id }, data });
      console.log(`updated: ${member.name}`);
    } else {
      await prisma.teamMember.create({ data });
      console.log(`created: ${member.name}`);
    }
  }

  const all = await prisma.teamMember.findMany({
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      name: true,
      role: true,
      featured: true,
      published: true,
      sortOrder: true,
      avatarUrl: true,
    },
  });

  console.table(all);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
