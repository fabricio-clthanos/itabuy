# Security Specification for ItaBuy Firestore Rules (ABAC Compliance)

## 1. Data Invariants

1. **User Ownership of Orders**: A customer can only create, view, or update orders where the `userId` matches their authenticated Firebase authentication UID (`request.auth.uid`). No customer can inspect another user's order.
2. **Immutability of Key Order Fields**: Once an order has been submitted, its base properties like `id`, `userId`, `items`, `total`, `date`, `paymentMethod`, and `address` are completely immutable. The user cannot manipulate these values to perform price tampering or change routing after checkout.
3. **Admin Exclusivity on Products/Coupons**: The catalog products and active system coupons can only be created, modified, or deleted by authorized administrators. Regular users have read-only access.
4. **Isolating Personal Profiles**: A user's private document under `users/{userId}` is strictly readable and writeable only by the owner `userId === request.auth.uid`. No user can alter another user's balance (`coins`) or owned coupon list.
5. **Verified Email Constraint**: Writing actions (checkout, updating coins) require that the user's email is verified (`request.auth.token.email_verified == true`).

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads attempt to bypass security boundaries. Our Fortress rules are designed to strictly reject all of them (producing `PERMISSION_DENIED`).

### Payload 1: Price Tampering
*Target: `create /orders/order_tamper`*
*Description: User tries to buy a high-end smartphone but modifies the payload price to R$ 1.00.*
```json
{
  "id": "order_tamper",
  "userId": "attacker123",
  "date": "2026-05-26",
  "total": 1.00,
  "itemsCount": 1,
  "status": "Pendente",
  "address": "Rua Eduardo Ribeiro, 12, Centro",
  "paymentMethod": "pix",
  "items": [{
    "product": { "id": "iphone15", "name": "iPhone 15 Pro", "price": 8999.00, "images": [] },
    "quantity": 1,
    "color": "Titanium",
    "size": "256GB"
  }]
}
```

### Payload 2: Identity Spoofing (Order Hijack)
*Target: `create /orders/hijacked`*
*Description: Attacker with UID `attacker123` attempts to place an order under UID `victim321`.*
```json
{
  "id": "hijacked",
  "userId": "victim321",
  "date": "2026-05-26",
  "total": 450.00,
  "itemsCount": 1,
  "status": "Pendente",
  "address": "Rua Eduardo Ribeiro, 12, Centro",
  "paymentMethod": "pix",
  "items": []
}
```

### Payload 3: Order Status Modification (State Bypass)
*Target: `update /orders/ord999`*
*Description: Attacker attempts to change order status straight to "Entregue" of a pending cash-on-delivery order.*
```json
{
  "status": "Entregue"
}
```

### Payload 4: Arbitrary User Coins Injection
*Target: `update /users/attacker123`*
*Description: Attacker attempts to inject 5,000,000 ItaCoins into their profile.*
```json
{
  "coins": 5000000
}
```

### Payload 5: Coupon Stealing
*Target: `create /coupons/steal`*
*Description: Non-admin user attempts to insert a 100% discount coupon in the global registry.*
```json
{
  "id": "steal",
  "code": "FREE100",
  "discount": 100,
  "type": "percentage",
  "minSpent": 0,
  "title": "Tudo Grátis",
  "expiry": "2030-01-01"
}
```

### Payload 6: Impersonating Admins (Admins collection insert)
*Target: `create /admins/attacker123`*
*Description: Attacker registers themselves in the administrative collection.*
```json
{
  "role": "admin",
  "email": "attacker123@gmail.com"
}
```

### Payload 7: Unauthorized Blanket Read of All User Accounts
*Target: `list /users`*
*Description: Attacker queries all user profiles to scrape private emails or ItaCoins balances.*

### Payload 8: Write to Product Catalog (Resource Poisoning)
*Target: `create /products/poisondoc`*
*Description: Regular user tries to add a spam entry to the storefront product list.*
```json
{
  "id": "poisondoc",
  "name": "Spam/Phishing Product",
  "price": 9999,
  "category": "celulares"
}
```

### Payload 9: Malicious ID Injection (Path Variable Poisoning)
*Target: `create /orders/some-huge-1000kb-malicious-character-id`*
*Description: Exceeding document path boundaries to consume disk resources.*

### Payload 10: Immutable Fields Alteration
*Target: `update /orders/ord123`*
*Description: User tries to change their shipping address or coupon after checkout.*

### Payload 11: System Field Overwriting via Claims
*Target: `update /products/prod555`*
*Description: Regular user attempts to edit a product's description or category.*

### Payload 12: Zero-Trust Verification Spoof
*Target: `create /orders/ord444`*
*Description: User with unverified email attempts to issue checkouts.*

---

## 3. The Security Test Suite Draft (`firestore.rules.test.ts`)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from "@firebase/rules-unit-testing";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("ItaBuy Security Rules", () => {
  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "ita-buy---definitivo",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8")
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should block Payload 1 (Price Tampering)", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    const orderRef = db.doc("orders/order_tamper");
    await assertFails(orderRef.set({
      id: "order_tamper",
      userId: "attacker123",
      date: "2026-05-26",
      total: 1.00,
      itemsCount: 1,
      status: "Pendente",
      address: "Rua Eduardo"
    }));
  });

  it("should block Payload 2 (Identity Spoof)", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    const orderRef = db.doc("orders/hijacked");
    await assertFails(orderRef.set({
      id: "hijacked",
      userId: "victim321",
      date: "2026-05-26",
      total: 450.00,
      status: "Pendente",
      address: "Rua Eduardo"
    }));
  });

  it("should prevent unauthorized catalog updates", async () => {
    const context = testEnv.authenticatedContext("attacker123", { email_verified: true });
    const db = context.firestore();
    const prodRef = db.doc("products/spambox");
    await assertFails(prodRef.set({ name: "Spam Product" }));
  });
});
```
