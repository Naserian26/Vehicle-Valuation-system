# Constants based on KRA 2025 structure
IMPORT_DUTY_RATE = 0.25
VAT_RATE = 0.16
IDF_RATE = 0.025
RDL_RATE = 0.015

def get_depreciation_rate(age_years):
    """
    Returns the depreciation percentage based on vehicle age.
    """
    if age_years < 0.5: return 0.05
    if age_years < 1.0: return 0.10
    if age_years < 2.0: return 0.15
    if age_years < 3.0: return 0.20
    if age_years < 4.0: return 0.30
    if age_years < 5.0: return 0.40
    if age_years < 6.0: return 0.50
    if age_years < 7.0: return 0.60
    if age_years < 8.0: return 0.70  # Fixed/Updated based on standard KRA scale
    return 0.70 # Max depreciation usually capped at 70% for older cars

def get_excise_duty_rate(engine_cc, fuel_type="Petrol"):
    """
    Determines Excise Duty based on CRSP 2025/2020 rules
    """
    # Simplified logic - you can expand this based on your specific CSV rules
    if engine_cc > 2500 and fuel_type == "Diesel":
        return 0.30
    if engine_cc > 2500 and fuel_type == "Petrol":
        return 0.30
    if engine_cc > 1500:
        return 0.25
    return 0.20

def calculate_taxes(crsp_value, engine_cc, manufacture_year, current_year=2025):
    age = current_year - manufacture_year
    if age < 0: age = 0
    
    depreciation_rate = get_depreciation_rate(age)
    customs_value = crsp_value * (1 - depreciation_rate)
    
    # 1. Import Duty
    import_duty = customs_value * IMPORT_DUTY_RATE
    
    # 2. Excise Duty (Paid on CV + ID)
    excise_rate = get_excise_duty_rate(engine_cc)
    excise_value_basis = customs_value + import_duty
    excise_duty = excise_value_basis * excise_rate
    
    # 3. VAT (Paid on CV + ID + ED)
    vat_value_basis = customs_value + import_duty + excise_duty
    vat = vat_value_basis * VAT_RATE
    
    # 4. Levies (IDF & RDL on Customs Value)
    idf = customs_value * IDF_RATE
    rdl = customs_value * RDL_RATE
    
    total_taxes = import_duty + excise_duty + vat + idf + rdl
    
    return {
        "crsp": crsp_value,
        "depreciation_rate": depreciation_rate,
        "customs_value": round(customs_value, 2),
        "import_duty": round(import_duty, 2),
        "excise_duty": round(excise_duty, 2),
        "vat": round(vat, 2),
        "idf": round(idf, 2),
        "rdl": round(rdl, 2),
        "total_taxes": round(total_taxes, 2)
    }