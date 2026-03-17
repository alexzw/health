import { differenceInDays } from "./date.js";

function round(value) {
  return Math.round(value * 10) / 10;
}

export function analyzeGrowthMeasurements(measurements) {
  const orderedMeasurements = [...measurements].sort(
    (left, right) => new Date(left.measuredAt) - new Date(right.measuredAt)
  );

  if (orderedMeasurements.length === 0) {
    return {
      measurements: [],
      summary: null,
      insights: [
        {
          level: "info",
          title: "暫時沒有成長數據",
          detail: "加入 Ryan 的第一筆身高和體重測量後，這裡就會開始顯示成長趨勢。"
        }
      ]
    };
  }

  const firstMeasurement = orderedMeasurements[0];
  const latestMeasurement = orderedMeasurements[orderedMeasurements.length - 1];
  const previousMeasurement = orderedMeasurements[orderedMeasurements.length - 2] || null;
  const insights = [];
  let heightVelocityCmPerMonth = null;
  let predictedHeightInSixMonthsCm = null;
  let status = "on_track";
  let summaryText = "Ryan 的成長趨勢整體平穩。";

  if (orderedMeasurements.length >= 2) {
    const totalDays = Math.max(1, differenceInDays(firstMeasurement.measuredAt, latestMeasurement.measuredAt));
    const totalHeightGain = latestMeasurement.heightCm - firstMeasurement.heightCm;
    heightVelocityCmPerMonth = round((totalHeightGain / totalDays) * 30);
    predictedHeightInSixMonthsCm = round(latestMeasurement.heightCm + heightVelocityCmPerMonth * 6);

    if (heightVelocityCmPerMonth < 0.4) {
      status = "watch";
      summaryText = "Ryan 最近的身高增長速度偏慢，建議保持定期量度。";
    } else if (heightVelocityCmPerMonth > 2.5) {
      status = "watch";
      summaryText = "Ryan 最近的身高增長速度比平時快，建議再觀察幾次量度確認趨勢。";
    } else {
      summaryText = "Ryan 的身高增長速度在現有資料中屬於穩定範圍。";
    }
  }

  if (previousMeasurement) {
    const daysBetweenMeasurements = differenceInDays(
      previousMeasurement.measuredAt,
      latestMeasurement.measuredAt
    );
    const latestHeightGain = latestMeasurement.heightCm - previousMeasurement.heightCm;
    const latestWeightGain = latestMeasurement.weightKg - previousMeasurement.weightKg;

    if (daysBetweenMeasurements >= 120 && latestHeightGain < 1.5) {
      status = "watch";
      insights.push({
        level: "warning",
        title: "身高增長較慢",
        detail: "最近一段較長時間內的身高變化偏小，建議再補一次量度，確認是不是穩定趨勢。"
      });
    }

    if (Math.abs(latestWeightGain) >= 4) {
      status = "watch";
      insights.push({
        level: "warning",
        title: "體重變化較快",
        detail: "最近一次體重變化幅度較大，建議確認量度值，並留意下一次更新。"
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      level: "good",
      title: "成長趨勢穩定",
      detail: "Ryan 的身高和體重在現有紀錄中持續穩定上升，目前看起來屬於平穩趨勢。"
    });
  }

  return {
    measurements: orderedMeasurements,
    summary: {
      latestMeasurement,
      firstMeasurement,
      totalHeightGainCm: round(latestMeasurement.heightCm - firstMeasurement.heightCm),
      totalWeightGainKg: round(latestMeasurement.weightKg - firstMeasurement.weightKg),
      heightVelocityCmPerMonth,
      predictedHeightInSixMonthsCm,
      status,
      summaryText
    },
    insights
  };
}
