from decimal import Decimal, ROUND_HALF_UP


def calculate_tax(subtotal: Decimal, tax_rate: Decimal) -> Decimal:
    return (subtotal * tax_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def calculate_total(subtotal: Decimal, tax_amount: Decimal) -> Decimal:
    return (subtotal + tax_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
