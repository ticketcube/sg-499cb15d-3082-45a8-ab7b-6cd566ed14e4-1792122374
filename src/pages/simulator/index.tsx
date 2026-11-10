import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface SimulationParams {
  slope: number; // degrees (uphill/downhill)
  sideSlope: number; // degrees (left/right break)
  distance: number; // feet
  greenSpeed: number; // stimp reading
  grainDirection: number; // degrees (0 = towards hole)
  grainStrength: number; // 0-1 scale
}

interface Point {
  x: number;
  y: number;
}

interface PuttPath {
  points: Point[];
  makesIt: boolean;
  speed: number;
  label: string;
  aimAngle?: number;
  endDistance?: number;
}

export default function SimulatorPage() {
  const [params, setParams] = useState<SimulationParams>({
    slope: 2,
    sideSlope: 0,
    distance: 10,
    greenSpeed: 10,
    grainDirection: 0,
    grainStrength: 0.3,
  });

  const [paths, setPaths] = useState<PuttPath[]>([]);

  useEffect(() => {
    simulatePutts();
  }, [params]);

  const simulatePutts = () => {
    const calculatedPaths: PuttPath[] = [];
    
    // Calculate physics constants
    const g = 32.2; // ft/s²
    const stimp = params.greenSpeed;
    const friction = 0.131 / stimp; // coefficient of rolling resistance
    
    // Convert slope to radians
    const slopeRad = (params.slope * Math.PI) / 180;
    const slopeEffect = g * Math.sin(slopeRad);
    
    // Search ranges
    const speedRange = { min: 2, max: 25 }; // ft/s
    const speedStep = 0.5;
    const angleRange = { min: -45, max: 45 }; // degrees to aim
    const angleStep = 0.5;
    const maxEndDistance = 3; // feet past hole
    
    const successfulPutts: { speed: number; angle: number; path: Point[]; endDist: number }[] = [];
    
    // 2D Search: for each speed, try angles until we make it
    for (let speed = speedRange.min; speed <= speedRange.max; speed += speedStep) {
      for (let angle = angleRange.min; angle <= angleRange.max; angle += angleStep) {
        const angleRad = (angle * Math.PI) / 180;
        const vx = speed * Math.sin(angleRad);
        const vy = speed * Math.cos(angleRad);
        
        const path = calculatePath(vx, vy, params, friction, slopeEffect, g);
        
        // Check if ball goes in the hole (within 2.125 inches radius)
        const holeRadius = 2.125 / 12; // convert to feet
        
        let makesIt = false;
        const endPoint = path[path.length - 1];
        const endDistance = Math.sqrt(
          Math.pow(endPoint.x, 2) + Math.pow(endPoint.y - params.distance, 2)
        );
        
        for (const point of path) {
          const distanceToHole = Math.sqrt(
            Math.pow(point.x, 2) + Math.pow(point.y - params.distance, 2)
          );
          
          // Ball makes it if it gets within hole radius
          if (distanceToHole <= holeRadius && point.y >= params.distance - 0.5 && point.y <= params.distance + 2) {
            makesIt = true;
            break;
          }
        }
        
        // Only accept putts that make it AND end within 3 feet of the hole
        if (makesIt && endDistance <= maxEndDistance) {
          successfulPutts.push({ speed, angle, path, endDist: endDistance });
          break; // Move to next speed once we find a working angle for this speed
        }
      }
    }
    
    // Process results for visualization
    if (successfulPutts.length > 0) {
      // Sort by speed
      successfulPutts.sort((a, b) => a.speed - b.speed);
      
      const lowPutt = successfulPutts[0];
      const highPutt = successfulPutts[successfulPutts.length - 1];
      
      calculatedPaths.push({
        points: lowPutt.path,
        makesIt: true,
        speed: lowPutt.speed,
        aimAngle: lowPutt.angle,
        endDistance: lowPutt.endDist,
        label: "Low",
      });
      
      if (successfulPutts.length > 1 && highPutt.speed > lowPutt.speed) {
        calculatedPaths.push({
          points: highPutt.path,
          makesIt: true,
          speed: highPutt.speed,
          aimAngle: highPutt.angle,
          endDistance: highPutt.endDist,
          label: "High",
        });
      }
      
      // Add miss examples that end within 3 feet (slightly off aim)
      // Miss #1: aim 3 degrees off from low putt
      const miss1Angle = lowPutt.angle - 3;
      const miss1Vx = lowPutt.speed * Math.sin((miss1Angle * Math.PI) / 180);
      const miss1Vy = lowPutt.speed * Math.cos((miss1Angle * Math.PI) / 180);
      const miss1Path = calculatePath(miss1Vx, miss1Vy, params, friction, slopeEffect, g);
      const miss1End = miss1Path[miss1Path.length - 1];
      const miss1Dist = Math.sqrt(
        Math.pow(miss1End.x, 2) + Math.pow(miss1End.y - params.distance, 2)
      );
      
      if (miss1Dist <= maxEndDistance) {
        calculatedPaths.push({
          points: miss1Path,
          makesIt: false,
          speed: lowPutt.speed,
          aimAngle: miss1Angle,
          endDistance: miss1Dist,
          label: "Miss Left",
        });
      }
      
      // Miss #2: aim 3 degrees off from low putt (other direction)
      const miss2Angle = lowPutt.angle + 3;
      const miss2Vx = lowPutt.speed * Math.sin((miss2Angle * Math.PI) / 180);
      const miss2Vy = lowPutt.speed * Math.cos((miss2Angle * Math.PI) / 180);
      const miss2Path = calculatePath(miss2Vx, miss2Vy, params, friction, slopeEffect, g);
      const miss2End = miss2Path[miss2Path.length - 1];
      const miss2Dist = Math.sqrt(
        Math.pow(miss2End.x, 2) + Math.pow(miss2End.y - params.distance, 2)
      );
      
      if (miss2Dist <= maxEndDistance) {
        calculatedPaths.push({
          points: miss2Path,
          makesIt: false,
          speed: lowPutt.speed,
          aimAngle: miss2Angle,
          endDistance: miss2Dist,
          label: "Miss Right",
        });
      }
    }
    
    setPaths(calculatedPaths);
  };

  const calculatePath = (
    initialVx: number,
    initialVy: number,
    params: SimulationParams,
    friction: number,
    slopeEffect: number,
    g: number
  ): Point[] => {
    const points: Point[] = [];
    const dt = 0.01; // time step
    const maxTime = 10; // max simulation time
    
    let x = 0;
    let y = 0;
    let vx = initialVx;
    let vy = initialVy;
    
    // Side slope effect (positive = breaks right)
    const sideSlopeRad = (params.sideSlope * Math.PI) / 180;
    const sideSlopeEffect = g * Math.sin(sideSlopeRad);
    
    // Grain effect (0 = towards hole = +Y, 90 = right = +X)
    const grainRad = (params.grainDirection * Math.PI) / 180;
    const grainForceX = params.grainStrength * 0.5 * Math.sin(grainRad);
    const grainForceY = params.grainStrength * 0.5 * Math.cos(grainRad);
    
    for (let t = 0; t < maxTime; t += dt) {
      points.push({ x, y });
      
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed < 0.1) break; // Ball stopped
      
      // Friction opposes motion
      const frictionForceX = -friction * g * (vx / speed);
      const frictionForceY = -friction * g * (vy / speed);
      
      // Update velocity
      vx += (frictionForceX + grainForceX + sideSlopeEffect) * dt;
      vy += (frictionForceY + grainForceY - slopeEffect) * dt;
      
      // Update position
      x += vx * dt;
      y += vy * dt;
      
      // Stop if ball reaches far past the hole
      if (y > params.distance + 15) break;
    }
    
    return points;
  };

  const updateParam = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Scale for visualization
  const scale = 30; // pixels per foot
  const viewWidth = 600;
  const viewHeight = 800;
  const holeX = viewWidth / 2;
  const holeY = 100; // Hole at the top

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">Golf Putt Simulator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Slope (Uphill): {params.slope.toFixed(1)}°</Label>
                <Slider
                  value={[params.slope]}
                  onValueChange={([value]) => updateParam("slope", value)}
                  min={0}
                  max={5}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">Uphill/downhill slope</p>
              </div>

              <div className="space-y-2">
                <Label>Side Slope: {params.sideSlope.toFixed(1)}°</Label>
                <Slider
                  value={[params.sideSlope]}
                  onValueChange={([value]) => updateParam("sideSlope", value)}
                  min={-5}
                  max={5}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">Left (-) / Right (+) break</p>
              </div>

              <div className="space-y-2">
                <Label>Distance: {params.distance.toFixed(1)} ft</Label>
                <Slider
                  value={[params.distance]}
                  onValueChange={([value]) => updateParam("distance", value)}
                  min={3}
                  max={30}
                  step={0.5}
                />
                <p className="text-sm text-muted-foreground">Distance to hole</p>
              </div>

              <div className="space-y-2">
                <Label>Green Speed: {params.greenSpeed.toFixed(1)} (Stimp)</Label>
                <Slider
                  value={[params.greenSpeed]}
                  onValueChange={([value]) => updateParam("greenSpeed", value)}
                  min={7}
                  max={14}
                  step={0.5}
                />
                <p className="text-sm text-muted-foreground">Stimpmeter reading (higher = faster)</p>
              </div>

              <div className="space-y-2">
                <Label>Grain Direction: {params.grainDirection.toFixed(0)}°</Label>
                <Slider
                  value={[params.grainDirection]}
                  onValueChange={([value]) => updateParam("grainDirection", value)}
                  min={-90}
                  max={90}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">0° = with putt, ±90° = cross grain</p>
              </div>

              <div className="space-y-2">
                <Label>Grain Strength: {params.grainStrength.toFixed(2)}</Label>
                <Slider
                  value={[params.grainStrength]}
                  onValueChange={([value]) => updateParam("grainStrength", value)}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <p className="text-sm text-muted-foreground">Effect of grain on ball direction</p>
              </div>

              <Button onClick={simulatePutts} className="w-full">
                Recalculate
              </Button>

              {paths.length > 0 && (
                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold">Results</h3>
                  {paths.filter(p => p.makesIt).length > 0 ? (
                    <>
                      {paths.filter(p => p.makesIt).map((path, idx) => (
                        <div key={idx} className="space-y-1 p-3 bg-muted/50 rounded-md">
                          <div className="font-medium text-base">{path.label} Path</div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Speed:</span>{" "}
                            <span className="font-semibold">{path.speed.toFixed(1)} ft/s</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Aim:</span>{" "}
                            <span className="font-semibold">
                              {path.aimAngle! > 0 
                                ? `${path.aimAngle!.toFixed(1)}° Right` 
                                : path.aimAngle! < 0
                                ? `${Math.abs(path.aimAngle!).toFixed(1)}° Left`
                                : "Straight"}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Ends:</span>{" "}
                            <span className="font-semibold">{path.endDistance!.toFixed(1)} ft past hole</span>
                          </div>
                        </div>
                      ))}
                      
                      {paths.filter(p => !p.makesIt).length > 0 && (
                        <div className="pt-2">
                          <div className="text-sm font-medium mb-2">Misses (within 3ft):</div>
                          {paths.filter(p => !p.makesIt).map((path, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground ml-2">
                              {path.label}: {path.aimAngle! > 0 
                                ? `${path.aimAngle!.toFixed(1)}° Right` 
                                : `${Math.abs(path.aimAngle!).toFixed(1)}° Left`}
                              {" "}({path.endDistance!.toFixed(1)}ft from hole)
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No successful putts found that end within 3 feet. Try adjusting parameters.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Putt Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <svg width={viewWidth} height={viewHeight} className="border border-border rounded-lg bg-green-50">
                {/* Green */}
                <rect x={0} y={0} width={viewWidth} height={viewHeight} fill="#10b981" fillOpacity={0.1} />
                
                {/* Grid lines */}
                {Array.from({ length: Math.ceil(viewHeight / scale) }).map((_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={holeY + i * scale}
                    x2={viewWidth}
                    y2={holeY + i * scale}
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                ))}
                {Array.from({ length: Math.ceil(viewWidth / scale) }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * scale}
                    y1={0}
                    x2={i * scale}
                    y2={viewHeight}
                    stroke="#d1d5db"
                    strokeWidth={0.5}
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Starting position marker */}
                <line
                  x1={holeX - 15}
                  y1={holeY + params.distance * scale}
                  x2={holeX + 15}
                  y2={holeY + params.distance * scale}
                  stroke="#6b7280"
                  strokeWidth={2}
                />
                <text
                  x={holeX + 20}
                  y={holeY + params.distance * scale + 5}
                  fill="#6b7280"
                  fontSize="12"
                  fontWeight="600"
                >
                  Start ({params.distance}ft)
                </text>

                {/* Hole */}
                <circle
                  cx={holeX}
                  cy={holeY}
                  r={(2.125 / 12) * scale}
                  fill="#1f2937"
                  stroke="#000"
                  strokeWidth={2}
                />
                <circle
                  cx={holeX}
                  cy={holeY}
                  r={3}
                  fill="#fff"
                />
                <text
                  x={holeX + 15}
                  y={holeY + 5}
                  fill="#1f2937"
                  fontSize="12"
                  fontWeight="600"
                >
                  Hole
                </text>

                {/* Draw paths */}
                {paths.map((path, pathIdx) => {
                  const color = path.makesIt 
                    ? (path.label === "Low" ? "#3b82f6" : "#8b5cf6")
                    : "#ef4444";
                  const opacity = path.makesIt ? 1 : 0.4;
                  
                  return (
                    <g key={pathIdx}>
                      <polyline
                        points={path.points
                          .map(p => `${holeX + p.x * scale},${holeY + (params.distance - p.y) * scale}`)
                          .join(" ")}
                        fill="none"
                        stroke={color}
                        strokeWidth={path.makesIt ? 3 : 2}
                        strokeOpacity={opacity}
                        strokeDasharray={path.makesIt ? "none" : "4,2"}
                      />
                      
                      {/* Starting point */}
                      <circle
                        cx={holeX + path.points[0].x * scale}
                        cy={holeY + (params.distance - path.points[0].y) * scale}
                        r={5}
                        fill={color}
                        fillOpacity={opacity}
                      />
                      
                      {/* End point */}
                      {path.points.length > 0 && (
                        <circle
                          cx={holeX + path.points[path.points.length - 1].x * scale}
                          cy={holeY + (params.distance - path.points[path.points.length - 1].y) * scale}
                          r={4}
                          fill={color}
                          fillOpacity={opacity * 0.7}
                        />
                      )}
                      
                      {/* Label */}
                      {path.points.length > 5 && (
                        <text
                          x={holeX + path.points[Math.floor(path.points.length / 2)].x * scale + 10}
                          y={holeY + (params.distance - path.points[Math.floor(path.points.length / 2)].y) * scale}
                          fill={color}
                          fontSize="12"
                          fontWeight="600"
                        >
                          {path.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span>Low path (minimum speed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-purple-500"></div>
                  <span>High path (maximum speed)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500 opacity-40"></div>
                  <span>Missed putts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}