import { User, Drop, Reservation, Purchase } from "../../models";

/**
 * Seeds the database with some initial data for testing.
 */
export async function seedDatabase() {
  try {
    // check if we already seeded by looking for admin user
    const existingAdmin = await User.findOne({
      where: { email: "admin@techzu.com" },
    });

    if (existingAdmin) {
      console.log("database already seeded, skipping...");
      return;
    }

    console.log("seeding database...");

    // ---- create users ----
    const admin = await User.create({
      username: "admin",
      email: "admin@techzu.com",
      password: "123456",
      role: "admin",
    });

    const john = await User.create({
      username: "johndoe",
      email: "john@example.com",
      password: "123456",
      role: "user",
    });

    const sarah = await User.create({
      username: "sarah_k",
      email: "sarah@example.com",
      password: "123456",
      role: "user",
    });

    const mike = await User.create({
      username: "mike92",
      email: "mike@example.com",
      password: "123456",
      role: "user",
    });

    const emma = await User.create({
      username: "emma_w",
      email: "emma@example.com",
      password: "123456",
      role: "user",
    });

    console.log("  users created");

    // ---- create drops ----
    const drops = await Promise.all([
      Drop.create({
        name: "Nike Air Jordan 1 Retro High OG",
        price: 180.0,
        totalStock: 50,
        availableStock: 42,
        imageUrl:
          "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-28T10:00:00Z"),
      }),
      Drop.create({
        name: "Adidas Yeezy Boost 350 V2",
        price: 230.0,
        totalStock: 30,
        availableStock: 24,
        imageUrl:
          "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-28T12:00:00Z"),
      }),
      Drop.create({
        name: "New Balance 550 White Green",
        price: 120.0,
        totalStock: 80,
        availableStock: 73,
        imageUrl:
          "https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-27T09:00:00Z"),
      }),
      Drop.create({
        name: "Nike Dunk Low Panda",
        price: 110.0,
        totalStock: 100,
        availableStock: 88,
        imageUrl:
          "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-26T14:00:00Z"),
      }),
      Drop.create({
        name: "Jordan 4 Retro Military Black",
        price: 210.0,
        totalStock: 40,
        availableStock: 35,
        imageUrl:
          "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-03-01T08:00:00Z"),
      }),
      Drop.create({
        name: "Converse Chuck 70 High",
        price: 85.0,
        totalStock: 150,
        availableStock: 145,
        imageUrl:
          "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-25T11:00:00Z"),
      }),
      Drop.create({
        name: "Nike Air Force 1 Low White",
        price: 100.0,
        totalStock: 200,
        availableStock: 187,
        imageUrl:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-24T10:00:00Z"),
      }),
      Drop.create({
        name: "Puma Suede Classic XXI",
        price: 75.0,
        totalStock: 120,
        availableStock: 118,
        imageUrl:
          "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-23T16:00:00Z"),
      }),
      Drop.create({
        name: "Reebok Club C 85 Vintage",
        price: 80.0,
        totalStock: 90,
        availableStock: 87,
        imageUrl:
          "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-22T13:00:00Z"),
      }),
      Drop.create({
        name: "Vans Old Skool Black",
        price: 65.0,
        totalStock: 180,
        availableStock: 172,
        imageUrl:
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-21T09:30:00Z"),
      }),
      // --- second batch of drops ---
      Drop.create({
        name: "Nike SB Dunk High Pro",
        price: 125.0,
        totalStock: 60,
        availableStock: 58,
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-20T10:00:00Z"),
      }),
      Drop.create({
        name: "Adidas Samba OG White",
        price: 100.0,
        totalStock: 90,
        availableStock: 85,
        imageUrl:
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-19T14:00:00Z"),
      }),
      Drop.create({
        name: "Nike Air Max 90 Infrared",
        price: 140.0,
        totalStock: 70,
        availableStock: 65,
        imageUrl:
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-18T08:30:00Z"),
      }),
      Drop.create({
        name: "ASICS Gel-Kayano 14",
        price: 150.0,
        totalStock: 45,
        availableStock: 43,
        imageUrl:
          "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-17T11:00:00Z"),
      }),
      Drop.create({
        name: "Jordan 11 Retro Cool Grey",
        price: 225.0,
        totalStock: 35,
        availableStock: 32,
        imageUrl:
          "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-16T09:00:00Z"),
      }),
      Drop.create({
        name: "Nike Blazer Mid 77 Vintage",
        price: 105.0,
        totalStock: 110,
        availableStock: 107,
        imageUrl:
          "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-15T13:00:00Z"),
      }),
      Drop.create({
        name: "Adidas Ultra Boost 22",
        price: 190.0,
        totalStock: 55,
        availableStock: 50,
        imageUrl:
          "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-14T10:30:00Z"),
      }),
      Drop.create({
        name: "New Balance 2002R Protection Pack",
        price: 149.99,
        totalStock: 40,
        availableStock: 37,
        imageUrl:
          "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-13T15:00:00Z"),
      }),
      Drop.create({
        name: "Nike Air Max 97 Silver Bullet",
        price: 175.0,
        totalStock: 65,
        availableStock: 60,
        imageUrl:
          "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-12T12:00:00Z"),
      }),
      Drop.create({
        name: "Salomon XT-6 Advanced",
        price: 200.0,
        totalStock: 30,
        availableStock: 28,
        imageUrl:
          "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=600&h=400&fit=crop",
        dropStartsAt: new Date("2026-02-11T08:00:00Z"),
      }),
    ]);

    console.log(`  ${drops.length} drops created`);

    // ---- create some completed reservatons + purchases ----
    // to simulate some users already bought sneakers

    const purchaseData = [
      { user: john, drop: drops[0], ago: 3 }, // john bought jordan 1
      { user: sarah, drop: drops[0], ago: 2 }, // sarah bought jordan 1
      { user: mike, drop: drops[0], ago: 1 }, // mike bought jordan 1
      { user: emma, drop: drops[1], ago: 4 }, // emma bought yeezy
      { user: john, drop: drops[1], ago: 2 }, // john bought yeezy
      { user: sarah, drop: drops[2], ago: 5 }, // sarah bought NB 550
      { user: mike, drop: drops[3], ago: 1 }, // mike bought dunk low
      { user: emma, drop: drops[3], ago: 3 }, // emma bought dunk low
      { user: john, drop: drops[4], ago: 1 }, // john bought jordan 4
      { user: admin, drop: drops[6], ago: 2 }, // admin bought af1
    ];

    for (const pd of purchaseData) {
      const hoursAgo = pd.ago * 24; // days ago converted to hours
      const reservedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      const expiredAt = new Date(reservedAt.getTime() + 60 * 1000);

      const reservation = await Reservation.create({
        userId: pd.user.id,
        dropId: pd.drop.id,
        status: "completed",
        expiresAt: expiredAt,
        createdAt: reservedAt,
        updatedAt: reservedAt,
      });

      await Purchase.create({
        userId: pd.user.id,
        dropId: pd.drop.id,
        reservationId: reservation.id,
        createdAt: new Date(reservedAt.getTime() + 15000), // purchased 15s after reserving
        updatedAt: new Date(reservedAt.getTime() + 15000),
      });
    }

    console.log(`  ${purchaseData.length} purchases seeded`);
    console.log("database seeding complete!");
  } catch (err) {
    console.error("seeding error:", err);
  }
}

seedDatabase();
