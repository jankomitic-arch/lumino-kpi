c = open('src/app/components/KPIDashboard.tsx').read()

c = c.replace(
    "import { useState } from 'react';",
    "import { useState, useEffect, useCallback } from 'react';"
)

c = c.replace(
    "  const [sumadijaData, setSumadijaData] = useState<TeamWeekData>({});",
    """  const [sumadijaData, setSumadijaData] = useState<TeamWeekData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!year || !month) { setLoading(false); return; }
    setLoading(true);
    fetch('/api/kpi?year=' + year + '&month=' + month)
      .then(r => r.json())
      .then(data => {
        if (data.panonija) setPanonijaData(data.panonija);
        if (data.sumadija) setSumadijaData(data.sumadija);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const saveToDB = useCallback(async (team, weekId, day, entry) => {
    if (!year || !month) return;
    setSaving(true);
    try {
      await fetch('/api/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, team, weekId, day, location: entry.location, power: entry.power, points: parseFloat(entry.points) || 0 })
      });
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  }, [year, month]);"""
)

open('src/app/components/KPIDashboard.tsx', 'w').write(c)
print("Gotovo!")
