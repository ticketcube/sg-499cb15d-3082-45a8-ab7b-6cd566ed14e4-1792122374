import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";

interface SimulationParams {
  slope: number; // degrees
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
}

export default function SimulatorPage() {
  const [params, setParams] = useState<SimulationParams>({
    slope: 2,
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
    
    // Try different initial speeds to find high and low paths
    const speedRange = { min: 3, max: 15 }; // ft/s
    const speedStep = 0.1;
    
    for (let speed = speedRange.min; speed <= speedRange.max; speed += speedStep) {
      const path = calculatePath(speed, params, friction, slopeEffect, g);
      
      // Check if ball goes in the hole (within 2.125 inches radius)
      const holeRadius = 2.125 / 12; // convert to feet
      const finalPoint = path[path.length - 1];
      const distanceToHole = Math.sqrt(
        Math.pow(finalPoint.x, 2) + Math.pow(finalPoint.y - params.distance, 2)
      );
      
      if (distanceToHole <= holeRadius && path[path.length - 1].y >= params.distance - 0.5) {
        const makesIt = true;
        calculatedPaths.push({
          points: path,
          makesIt,
          speed,
          label: calculatedPaths.filter(p => p.makesIt).length === 0 ? "Low" : "High",
        });
        
        // Only keep first (low) and last (high) successful putts
        if (calculatedPaths.filter(p => p.makesIt).length >= 2) {
          const successful = calculatedPaths.filter(p => p.makesIt);
          calculatedPaths.length = 0;
          calculatedPaths.push(successful[0], successful[successful.length - 1]);
          break;
        }
      }
    }
    
    // Add some miss examples
    if (calculatedPaths.length > 0) {
      const lowSpeed = calculatedPaths[0].speed;
      const highSpeed = calculatedPaths[calculatedPaths.length - 1].speed;
      
      // Too soft
      const tooSoft = calculatePath(lowSpeed * 0.7, params, friction, slopeEffect, g);
      calculatedPaths.push({
        points: tooSoft,
        makesIt: false,
        speed: lowSpeed * 0.7,
        label: "Too soft",
      });
      
      // Too hard
      const tooHard = calculatePath(highSpeed * 1.3, params, friction, slopeEffect, g);
      calculatedPaths.push({
        points: tooHard,
        makesIt: false,
        speed: highSpeed * 1.3,
        label: "Too hard",
      });
    }
    
    setPaths(calculatedPaths);
  };

  const calculatePath = (
    initialSpeed: number,
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
    let vx = 0;
    let vy = initialSpeed;
    
    // Grain effect as a lateral force
    const grainRad = (params.grainDirection * Math.PI) / 180;
    const grainForceX = params.grainStrength * 0.5 * Math.cos(grainRad);
    const grainForceY = params.grainStrength * 0.5 * Math.sin(grainRad);
    
    for (let t = 0; t < maxTime; t += dt) {
      points.push({ x, y });
      
      // Calculate speed
      const speed = Math.sqrt(vx * vx + vy * vy);
      
      if (speed < 0.1) break; // Ball stopped
      
      // Friction opposes motion
      const frictionForceX = -friction * g * (vx / speed);
      const frictionForceY = -friction * g * (vy / speed);
      
      // Slope effect (assuming uphill/downhill in y direction)
      const slopeForceY = -slopeEffect;
      
      // Update velocity
      vx += (frictionForceX + grainForceX) * dt;
      vy += (frictionForceY + grainForceY + slopeForceY) * dt;
      
      // Update position
      x += vx * dt;
      y += vy * dt;
      
      // Stop if ball reaches far past the hole
      if (y > params.distance + 10) break;
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
  const holeY = 100;

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
                <Label>Slope: {params.slope.toFixed(1)}°</Label>
                <Slider
                  value={[params.slope]}
                  onValueChange={([value]) => updateParam("slope", value)}
                  min={0}
                  max={5}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">Uphill slope in degrees</p>
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
                <div className="pt-4 border-t space-y-2">
                  <h3 className="font-semibold">Results</h3>
                  {paths.filter(p => p.makesIt).map((path, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{path.label} Path:</span>{" "}
                      {path.speed.toFixed(1)} ft/s
                    </div>
                  ))}
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
                          .map(p => `${holeX + p.x * scale},${holeY + p.y * scale}`)
                          .join(" ")}
                        fill="none"
                        stroke={color}
                        strokeWidth={path.makesIt ? 2 : 1.5}
                        strokeOpacity={opacity}
                        strokeDasharray={path.makesIt ? "none" : "4,2"}
                      />
                      
                      {/* Starting point */}
                      <circle
                        cx={holeX}
                        cy={holeY + path.points[0].y * scale}
                        r={4}
                        fill={color}
                        fillOpacity={opacity}
                      />
                      
                      {/* End point for misses */}
                      {!path.makesIt && path.points.length > 0 && (
                        <circle
                          cx={holeX + path.points[path.points.length - 1].x * scale}
                          cy={holeY + path.points[path.points.length - 1].y * scale}
                          r={3}
                          fill={color}
                          fillOpacity={opacity}
                        />
                      )}
                      
                      {/* Label */}
                      <text
                        x={holeX + (path.points[Math.floor(path.points.length / 3)]?.x || 0) * scale + 10}
                        y={holeY + (path.points[Math.floor(path.points.length / 3)]?.y || 0) * scale}
                        fill={color}
                        fontSize="12"
                        fontWeight="600"
                      >
                        {path.label}
                      </text>
                    </g>
                  );
                })}

                {/* Distance marker */}
                <text
                  x={holeX + 20}
                  y={holeY + params.distance * scale}
                  fill="#6b7280"
                  fontSize="11"
                >
                  {params.distance}ft
                </text>
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