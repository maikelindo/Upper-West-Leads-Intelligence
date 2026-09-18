import { ALL_VISITED_LEADS } from '../src/data/visitedLeadsData';

console.log('--- ALL VISITED LEADS BY MONTH ---');
const byMonth: Record<string, typeof ALL_VISITED_LEADS> = {};
ALL_VISITED_LEADS.forEach(l => {
  if (!byMonth[l.month]) byMonth[l.month] = [];
  byMonth[l.month].push(l);
});

for (const [m, leads] of Object.entries(byMonth)) {
  console.log('\n=== Month [' + m + ']: count = ' + leads.length + ' ===');
  leads.forEach(l => {
    console.log('  No ' + l.no + ': ' + l.leadName + ' | In: ' + l.incomingLeads + ' | Visit: ' + l.dateVisit + ' | ' + l.assignedTo + ' | ' + l.status);
  });
}
