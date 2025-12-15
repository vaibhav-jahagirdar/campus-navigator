export type FloorPoint = {
  id: number;      // 1..41 (matches WiFi/manual index)
  x: number;       // placeholder manual units
  y: number;
  fx: number;      // figma/SVG pixel coordinates
  fy: number;
  tag: string;     // display name
};

export const floor1Points: FloorPoint[] = [
  { id: 1,  x: 0,  y: 0,   fx: 364, fy: 235, tag: "entrance" },
  { id: 2,  x: 11, y: 0,   fx: 448, fy: 235, tag: "class room AI09-1F21-LH" },
  { id: 3,  x: 11, y: 6,   fx: 460, fy: 286, tag: "" },
  { id: 4,  x: 12, y: 11,  fx: 470, fy: 344, tag: "" },
  { id: 5,  x: 12, y: 17,  fx: 475, fy: 380, tag: "" },
  { id: 6,  x: 12, y: 23,  fx: 475, fy: 465, tag: "" },
  { id: 7,  x: 12, y: 29,  fx: 475, fy: 509, tag: "" },
  { id: 8,  x: 12, y: 35,  fx: 475, fy: 562, tag: "classroom  AI09-1AF22-LH" },

  // corridor right side
  { id: 9,  x: 20, y: 0,   fx: 548, fy: 235, tag: "" },
  { id: 10, x: 20, y: 7,   fx: 548, fy: 296, tag: "" },
  { id: 11, x: 20, y: 11,  fx: 548, fy: 343, tag: "" },

  // middle corridor
  { id: 12, x: 35, y: 0,   fx: 649, fy: 235, tag: "" },
  { id: 13, x: 35, y: 7,   fx: 648, fy: 344, tag: "" },
  { id: 14, x: 43, y: 0,   fx: 746, fy: 234, tag: "" },
  { id: 15, x: 53, y: 0,   fx: 853, fy: 235, tag: "" },
  { id: 16, x: 73, y: 0,   fx: 1032, fy: 235, tag: "AI09-1AF23-LH & AI09-1AF24-LH" },
  { id: 17, x: 59, y: 11,  fx: 932, fy: 343, tag: "" },

  // P18 missing

  // long corridor
  { id: 19, x: 77, y: 0,   fx: 1098, fy: 240, tag: "" },
  { id: 20, x: 77, y: 15,  fx: 1098, fy: 376, tag: "" },
  { id: 21, x: 77, y: 35,  fx: 1098, fy: 570, tag: "AI09-1AF25-LH & AI09-1AF26-LH" },
  { id: 22, x: 70, y: 70,  fx: 1041, fy: 716, tag: "" },
  { id: 23, x: 60, y: 54,  fx: 935,  fy: 720, tag: "staff room-1" },
  { id: 24, x: 60, y: 68,  fx: 938,  fy: 951, tag: "" },

  // P25 missing

  // stairs and EC side
  { id: 26, x: 60, y: 85,  fx: 937, fy: 1085, tag: "" },
  { id: 27, x: 60, y: 101, fx: 937, fy: 1182, tag: "" },
  { id: 28, x: 54, y: 109, fx: 824, fy: 1251, tag: "stairs to ground floor" },
  { id: 29, x: 54, y: 117, fx: 823, fy: 1339, tag: "" },
  { id: 30, x: 54, y: 140, fx: 825, fy: 1479, tag: "" },

  // EC lab cluster
  { id: 31, x: 64, y: 122, fx: 963, fy: 1400, tag: "" },
  { id: 32, x: 71, y: 124, fx: 1058, fy: 1400, tag: "AE & DE lab" },
  { id: 33, x: 78, y: 124, fx: 1125, fy: 1400, tag: "" },


  { id: 34, x: 70, y: 149, fx: 1010, fy: 1605, tag: "DSP & VLSI lab" },


  { id: 35, x: 35, y: 140, fx: 704, fy: 1485, tag: "" },
  { id: 36, x: -9, y: 140, fx: 298, fy: 1489, tag: "AI091F001 - innovation lab" },
  { id: 37, x: -1, y: 155, fx: 318, fy: 1681, tag: "IQAC room" },


  { id: 38, x: -5, y: 115, fx: 284, fy: 1306, tag: "" },
  { id: 39, x: -5, y: 65,  fx: 284, fy: 670,  tag: "" },
  { id: 40, x: -20, y: 23, fx: 151, fy: 594,  tag: "staff room-2" },
  { id: 41, x: -5, y: 7,   fx: 283, fy: 305,  tag: "" }
];
