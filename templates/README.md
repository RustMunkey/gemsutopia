# Email Templates

HTML email templates for Gemsutopia. These templates use Handlebars-style `{{variable}}` placeholders.

## Templates

### Order & Payment

| Template | Recipient | Description |
|----------|-----------|-------------|
| `order-confirmation.html` | Customer | Order placed successfully |
| `order-shipped.html` | Customer | Order has shipped with tracking |
| `order-cancelled.html` | Customer | Order was cancelled |
| `order-admin-notification.html` | Admin | New order received |
| `payment-failed.html` | Customer | Payment could not be processed |
| `refund-processed.html` | Customer | Refund has been issued |

### Auctions

| Template | Recipient | Description |
|----------|-----------|-------------|
| `bid-confirmation.html` | Bidder | Bid placed successfully |
| `outbid-notification.html` | Bidder | Someone placed a higher bid |
| `auction-won.html` | Winner | You won the auction |
| `auction-ended.html` | Bidder | Auction ended, you didn't win |

### Contact & Account

| Template | Recipient | Description |
|----------|-----------|-------------|
| `contact-form-confirmation.html` | Customer | We received your message |
| `contact-form-admin.html` | Admin | New contact form submission |
| `welcome.html` | Customer | Account created welcome email |

## Variables Reference

### Order Templates

```
{{customerName}}        - Customer's full name
{{orderId}}             - Order ID/number
{{currency}}            - Currency code (CAD, USD, etc.)
{{subtotal}}            - Order subtotal
{{shipping}}            - Shipping cost
{{total}}               - Order total

{{#each items}}
  {{this.name}}         - Item name
  {{this.quantity}}     - Quantity ordered
  {{this.price}}        - Item price
{{/each}}

{{shippingAddress.firstName}}
{{shippingAddress.lastName}}
{{shippingAddress.address}}
{{shippingAddress.apartment}}  - Optional
{{shippingAddress.city}}
{{shippingAddress.state}}
{{shippingAddress.zipCode}}
{{shippingAddress.country}}
{{shippingAddress.phone}}      - Optional
```

### Shipping Template (additional)

```
{{trackingNumber}}      - Tracking number
{{trackingUrl}}         - URL to track package
{{carrier}}             - Shipping carrier name
```

### Payment Failed Template (additional)

```
{{errorMessage}}        - Error/failure reason
```

### Refund Template (additional)

```
{{refundAmount}}        - Amount refunded
```

### Auction Templates

```
{{bidderName}} / {{winnerName}} - Bidder's name
{{auctionId}}           - Auction ID
{{title}}               - Auction item title
{{imageUrl}}            - Product image URL
{{currency}}            - Currency code
{{bidAmount}}           - Bid amount placed
{{currentBid}}          - Current highest bid
{{userBid}}             - User's bid amount
{{winningBid}}          - Final winning bid
{{endTime}}             - Auction end time
```

### Contact Templates

```
{{customerName}}        - Contact's name
{{customerEmail}}       - Contact's email
{{subject}}             - Message subject
{{message}}             - Message content
```

## Styling Notes

- All templates use inline CSS for email client compatibility
- Primary brand color: `#d4af37` (gold)
- Dark background: `#1a1a2e`
- Templates are responsive with max-width of 600px
- Use `{{#if variable}}...{{/if}}` for conditional content
- Use `{{#each array}}...{{/each}}` for loops

## Integration

These templates are implemented in `/src/lib/email/templates.ts`. To use a different template engine or customize the HTML, update both this folder and the TypeScript implementation.
