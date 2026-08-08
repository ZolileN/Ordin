# Pricing

## Plans (ZAR)

### Starter — R500–R1,500/month

- 1 control
- 2 data sources
- 1 business entity
- CSV/XLSX ingestion
- Basic matching and reconciliation
- Exception management
- Basic dashboard
- Email notifications

### Growth — R2,000–R5,000/month

- Up to 5 controls
- Multiple data sources
- Multiple users with RBAC
- Exception assignment
- Comments and evidence
- Advanced matching
- Custom business rules
- Advanced dashboards

### Business — R5,000–R15,000+/month

- Unlimited controls
- Multiple entities and branches
- Cross-entity reconciliation
- Advanced RBAC
- API access and webhooks
- Full audit trail
- Approval workflows
- SLA monitoring
- Custom reporting

## Enforcement

Limits are enforced in `src/lib/subscription/subscription-service.ts`:

```typescript
canCreateControl(organizationId)
canAddDataSource(organizationId)
canAddEntity(organizationId)
canAddBranch(organizationId)
canAddUser(organizationId)
hasFeature(organizationId, feature)
```

Stripe integration is abstracted behind the subscription model. For MVP, plans are assigned at signup without payment processing.
