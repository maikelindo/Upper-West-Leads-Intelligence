import fs from 'fs';

// Create a high-res, perfectly clean SVG of Upper West circular badge
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&amp;family=Barlow+Condensed:wght@800;900&amp;display=swap');
      .badge-bg { fill: #F6B327; }
      .text-navy { fill: #132E52; font-family: 'Barlow Condensed', 'Arial Black', sans-serif; font-weight: 900; }
      .text-sub { fill: #132E52; font-family: 'Montserrat', 'Arial Black', sans-serif; font-weight: 900; }
    </style>
  </defs>

  <!-- Clean Circle with no checkerboard -->
  <circle cx="250" cy="250" r="248" class="badge-bg" />

  <!-- Rotated group for iconic tilted typography (-12.5 deg) -->
  <g transform="rotate(-13 250 250)">
    <!-- UPPER -->
    <text x="75" y="195" class="text-navy" font-size="112" letter-spacing="1" font-stretch="condensed">UPPER</text>

    <!-- LIVE / PLAY -->
    <text x="88" y="245" class="text-sub" font-size="28" letter-spacing="4">LIVE</text>
    <text x="88" y="278" class="text-sub" font-size="28" letter-spacing="4">PLAY</text>

    <!-- EARN / MONEY! -->
    <text x="315" y="245" class="text-sub" font-size="28" letter-spacing="2">EARN</text>
    <text x="268" y="278" class="text-sub" font-size="28" letter-spacing="2">MONEY!</text>

    <!-- WEST -->
    <text x="180" y="380" class="text-navy" font-size="138" letter-spacing="1" font-stretch="condensed">WEST</text>
  </g>
</svg>`;

fs.writeFileSync('public/logo.svg', svgContent.trim());
console.log('SVG created successfully');
