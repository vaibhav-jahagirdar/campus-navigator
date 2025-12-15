export type FloorPoint = {
  id: number;          // 1..30 (matches WiFi/manual index)
  x: number;           // manual units (1 unit ≈ 0.355 m)
  y: number;
  fx: number;          // figma/SVG pixel coordinates
  fy: number;
  tag: string;         // display name
};
export const floor4Points: FloorPoint[] = [
  { id: 1,  x: 0.0,  y: 0.0,  fx: 437, fy: 1276, tag: "entrance" },
  { id: 2,  x: 4.0,  y: 0.0,  fx: 437, fy: 1265, tag: "" },
  { id: 3,  x: 10.0, y: 0.0,  fx: 437, fy: 1197, tag: "CLASSROOM 4F02" },
  { id: 4,  x: 10.0, y: 11, fx: 524, fy: 1196, tag: "" },
  { id: 5,  x: 10.0, y: 20.0, fx: 600, fy: 1196, tag: "" },
  { id: 6,  x: 10.0, y: 28.0, fx: 659, fy: 1196, tag: "" },
  { id: 7,  x: 11.0, y: 37.0, fx: 741, fy: 1195, tag: "CLASSROOM 4F03" },

  { id: 8,  x: 15.0, y: 0.0,  fx: 439, fy: 1115, tag: "" },
  { id: 9,  x: 21.0, y: 0.0,  fx: 438, fy: 1069, tag: "" },
  { id: 10, x: 25.0, y: 0.0,  fx: 438, fy: 1051, tag: "" },
  { id: 11, x: 28.0, y: 0.0,  fx: 435, fy: 1036, tag: "" },
  { id: 12, x: 32.0, y: 0.0,  fx: 437, fy: 1021, tag: "" },

  { id: 13, x: 46.0, y: 0.0,  fx: 438, fy: 935,  tag: "" },
  { id: 14, x: 54.0, y: 0.0,  fx: 436, fy: 901,  tag: "" },
  { id: 15, x: 56.0, y: 0.0,  fx: 438, fy: 798,  tag: "" },

  { id: 16, x: 56.0, y: 11.0, fx: 524, fy: 806, tag: "" },

  { id: 17, x: 63.0, y: 0.0,  fx: 437, fy: 773,  tag: "CLASSROOM 4F04" },
  { id: 18, x: 69.0, y: 0.0,  fx: 436, fy: 720,  tag: "CLASSROOM 4F05" },
  { id: 19, x: 57.0, y: 36.0, fx: 715, fy: 802,  tag: "MBA DEPARTMENT" },

  { id: 20, x: 75.0, y: 0.0,  fx: 436, fy: 663,  tag: "" },
  { id: 21, x: 73.0, y: 14.0, fx: 541, fy: 665, tag: "CLASSROOM 4F06" },
  { id: 22, x: 73.0, y: 24.0, fx: 627, fy: 664, tag: "MBA HALL 27" },
  { id: 23, x: 73.0, y: 36.0, fx: 724, fy: 665, tag: "CLASSROOM 4F08" },
];
