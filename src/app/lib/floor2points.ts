export type FloorPoint = {
  id: number;          // 1..30 (matches WiFi/manual index)
  x: number;           // manual units (1 unit ≈ 0.355 m)
  y: number;
  fx: number;          // figma/SVG pixel coordinates
  fy: number;
  tag: string;         // display name
};

export const floor2Points: FloorPoint[] = [
  { id: 1,  x: 0.0,  y: 0.0,  fx: 907, fy: 1508, tag: "floor 2 entrance" },
  { id: 2,  x: 5.0,  y: 0.0,  fx: 861, fy: 1508, tag: "AI09-2F16 CLASSROOM" },
  { id: 3,  x: 7.0,  y: 10.0, fx: 841, fy: 1405, tag: "" },
  { id: 4,  x: 8.0,  y: 20.0, fx: 838, fy: 1302, tag: "" },
  { id: 5,  x: 8.0,  y: 33.0, fx: 836, fy: 1194, tag: "2f17 classroom" },
  { id: 6,  x: 16.0, y: 1.0,  fx: 743, fy: 1508, tag: "" },
  { id: 7,  x: 25.0, y: 2.0,  fx: 663, fy: 1508, tag: "" },
  { id: 8,  x: 36.0, y: 3.0,  fx: 588, fy: 1508, tag: "" },
  { id: 9,  x: 46.0, y: 3.0,  fx: 450, fy: 1506, tag: "" },
  { id: 10, x: 55.0, y: 3.0,  fx: 363, fy: 1508, tag: "classroom 2f15" },
  { id: 11, x: 63.0, y: 2.0,  fx: 280, fy: 1507, tag: "classroom 2f14" },
  { id: 12, x: 49.0, y: 12.0, fx: 412, fy: 1405, tag: "" },
  { id: 13, x: 55.0, y: 24.0, fx: 407, fy: 1303, tag: "professor room 2f19" },
  { id: 14, x: 73.0, y: 35.0, fx: 200, fy: 1140, tag: "CLASSROM 2f13 & 2f12" },
  { id: 15, x: 55.0, y: 40.0, fx: 407, fy: 1153, tag: "" },
  { id: 16, x: 55.0, y: 50.0, fx: 406, fy: 1071, tag: "2f21 classroom" },
  { id: 17, x: 55.0, y: 60.0, fx: 406, fy: 903,  tag: "grievance redressal committee" },
  { id: 18, x: 55.0, y: 70.0, fx: 407, fy: 800,  tag: "IEDC (innovation cell)" },
  { id: 19, x: 55.0, y: 80.0, fx: 404, fy: 650,  tag: "dept CSE & AIML" },
  { id: 20, x: 57.0, y: 95.0, fx: 406, fy: 583,  tag: "" },
  { id: 21, x: 60.0, y: 100.0, fx: 381, fy: 513, tag: "stairs to 3rd floor" },
  { id: 22, x: 47.0, y: 100.0, fx: 482, fy: 505, tag: "" },
  { id: 23, x: 48.0, y: 112.0, fx: 475, fy: 407, tag: "" },
  { id: 24, x: 57.0, y: 126.0, fx: 545, fy: 293, tag: "seminar hall" },
  { id: 25, x: 72.0, y: 119.0, fx: 366, fy: 356, tag: "classroom AI09 (2F07)" },
  { id: 26, x: 40.0, y: 122.0, fx: 595, fy: 300, tag: "staff room" },
  { id: 27, x: 50.0, y: 118.0, fx: 536, fy: 350, tag: "" },
  { id: 28, x: 63.0, y: 115.0, fx: 468, fy: 351, tag: "classroom 2f07" },
  { id: 29, x: 55.0, y: 29.0, fx: 408, fy: 1250, tag: "professor room 2f20 " },
  { id: 30, x: 55.0, y: 54.0, fx: 408, fy: 1020, tag: "2f23 classroom " },
];