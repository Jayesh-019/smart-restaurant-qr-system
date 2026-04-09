from decimal import Decimal

from app.utils.tax_calculator import calculate_tax, calculate_total


def test_calculate_tax_uses_two_decimal_precision() -> None:
    subtotal = Decimal("249.50")
    tax = calculate_tax(subtotal, Decimal("0.08"))
    assert tax == Decimal("19.96")


def test_calculate_total_combines_subtotal_and_tax() -> None:
    total = calculate_total(Decimal("249.50"), Decimal("19.96"))
    assert total == Decimal("269.46")
