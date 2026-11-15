# Live SolisCloud field findings (captured 2026-11-15 ~13:00 ICT, real station)

Situation at capture: PV 2.32 kW = load 2.32 kW, battery 97% full and idle, grid 0 kW.
So "0 kW" for grid/battery was REAL at that moment. Bugs are in what is missing / mislabeled.

## stationDetail (`d`)
- power 2.323 (powerStr "kW"), capacity 9 kWp
- psum 0 (psumStr "kW"), psumZheng 0, psumFu 0, psumOrgin 0 (W)
- batteryPower 0 (batteryPowerStr "kW"), batteryPowerZheng 0, batteryPowerFu 0, batteryDirection 4, batteryPercent 97
- familyLoadPower 2.323 kW, totalLoadPower 2.323, bypassLoadPower 0
- TODAY energies (correct ones): batteryChargeEnergy 11.2, batteryDischargeEnergy 4.6,
  gridPurchasedDayEnergy 0, gridSellDayEnergy 0, homeLoadTodayEnergy 9.5
  (batteryTodayChargeEnergy / batteryTodayDischargeEnergy are 0 = WRONG field, do not use)
- MONTH: gridPurchasedMonthEnergy 47.14, gridSellMonthEnergy 0, batteryChargeMonthEnergy 176, batteryDischargeMonthEnergy 158.3, homeLoadMonthEnergy 354.54
- TOTAL: gridPurchasedTotalEnergy 150.22, gridSellTotalEnergy 1.28 (kWh)

## inverterDetail (`invData`)
- pac 2.323 kW, eToday 16.1, eMonth 325.1, eTotal 1.088 (eTotalStr "MWh")
- storageBatteryVoltage 53.3 V, storageBatteryCurrent 0 A, batteryCapacitySoc 97, batteryHealthSoh 100
- batteryPowerBms 0.085 kW, batteryState 0, bmsState 0, socDischargeSet 20 (min SOC reserve %)
- batteryTodayChargeEnergy 11.2, batteryTodayDischargeEnergy (present in inverterDetail)
- gridPurchasedTodayEnergy 0, gridSellTodayEnergy 0, gridPurchasedYesterdayEnergy 0.1
- inverterTemperature 57.6 °C, fac 49.97 Hz, uAc1 229.5 V, iAc1 9.9 A
- powerFactor 0, isShowPowerFactor 0 → PF NOT reported by this inverter. Do not display 0; show "N/A".
  Can estimate from acGridPowerA 2290 W / sqrt(2290² + acGridReactivePowerA 20²) ≈ 1.00 → label "est."
- gridDetailVo: gridVoltageA 229.5, gridCurrentA 1.55, gridPower 0, gridFac 49.97
- invGridTotalPower 2270 (W), psum 0

## Unit handling
Every value has a sibling `<field>Str` unit ("W","kW","MW","Wh","kWh","MWh"). Convert using it.
Never use the "> 15 means Watts" heuristic.

## Sign conventions (verify against `SolisCloud Platform API Document V2.0.3.pdf` if possible)
- Grid: psum > 0 = exporting (selling), psum < 0 = importing (buying). psumZheng / psumFu are the split magnitudes.
- Battery: batteryPower > 0 = charging, < 0 = discharging. batteryPowerZheng = charge part, batteryPowerFu = discharge part.
  If batteryPower is reported unsigned, derive sign from Zheng/Fu (or storageBatteryCurrent sign).
