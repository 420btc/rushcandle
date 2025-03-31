import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { Candle, Prediction } from '../types/candle';
import { Svg, Line, Rect, Text as SvgText, Circle, Path } from 'react-native-svg';

interface BettedCandle {
  timestamp: number;
  prediction: Prediction;
  isDoubleBet?: boolean;
}

interface CandleChartProps {
  candles: Candle[];
  currentCandle: Candle | null;
  highlightPattern?: { startIndex: number; endIndex: number };
  showLastCandle?: boolean;
  bettedCandles?: BettedCandle[];
  centerLastCandle?: boolean;
  xOffset?: number;
}

const CandleChart: React.FC<CandleChartProps> = ({ 
  candles, 
  currentCandle,
  highlightPattern,
  showLastCandle = false,
  bettedCandles = [],
  centerLastCandle = false,
  xOffset = 0
}) => {
  const [chartWidth, setChartWidth] = useState(Dimensions.get('window').width - 30); // Reduced margin
  const chartHeight = 320; // Maintained at 320px as requested
  
  // Ensure we don't duplicate candles by checking timestamps
  const allCandles = (() => {
    if (!currentCandle) return candles;
    
    // Check if current candle already exists in the candles array
    const currentCandleExists = candles.some(
      candle => candle.timestamp === currentCandle.timestamp
    );
    
    // Only add current candle if it doesn't already exist in the array
    return currentCandleExists ? candles : [...candles, currentCandle];
  })();
  
  // Skip rendering if no candles
  if (allCandles.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Calculate min and max values for chart scaling
  const prices = allCandles.flatMap(candle => [candle.high, candle.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Calculate the price range and apply a compression factor
  // Higher value = more compressed range = shorter candles
  const priceRange = maxPrice - minPrice;
  const compressionFactor = 1.4; // Changed from 1.3 to 1.4 as requested
  
  // Add padding to ensure all candles are fully visible
  const paddingPercentage = 0.01; // Reduced to 1% as requested
  const paddingAmount = priceRange * paddingPercentage;
  
  // Calculate adjusted min and max with padding
  const adjustedMinPrice = minPrice - paddingAmount;
  const adjustedMaxPrice = maxPrice + paddingAmount;
  
  // Apply compression factor to the adjusted range
  const effectiveRange = (adjustedMaxPrice - adjustedMinPrice) * compressionFactor;
  const midPrice = (adjustedMaxPrice + adjustedMinPrice) / 2;
  
  // Final price range for scaling
  const effectiveMinPrice = midPrice - (effectiveRange / 2);
  const effectiveMaxPrice = midPrice + (effectiveRange / 2);
  const effectivePriceRange = effectiveMaxPrice - effectiveMinPrice;

  // Calculate candle width based on chart width and number of candles
  // Show up to 50 candles as requested
  const visibleCandleCount = Math.min(allCandles.length, 50);
  const candleWidth = chartWidth / visibleCandleCount * 0.6; // Maintained at 0.6 as requested
  const spacing = chartWidth / visibleCandleCount * 0.4; // Maintained at 0.4 as requested

  // Function to convert price to y-coordinate
  const priceToY = (price: number) => {
    return chartHeight - ((price - effectiveMinPrice) / effectivePriceRange) * chartHeight;
  };

  // Calculate offset to center the last candle if requested
  let calculatedXOffset = xOffset;
  if (centerLastCandle && allCandles.length > 0 && xOffset === 0) {
    // Only show the last 50 candles to ensure they're visible
    const visibleCandles = Math.min(allCandles.length, 50);
    const lastCandleX = (visibleCandles - 1) * (candleWidth + spacing) + spacing / 2;
    const centerX = chartWidth / 2 - candleWidth / 2;
    calculatedXOffset = centerX - lastCandleX;
    
    // Limit the offset to prevent too much empty space
    const maxOffset = 0;
    const minOffset = chartWidth - (visibleCandles * (candleWidth + spacing));
    calculatedXOffset = Math.min(maxOffset, Math.max(minOffset, calculatedXOffset));
  }

  // Check if a candle has a bet on it - deduplicate by timestamp
  const isBettedCandle = (timestamp: number) => {
    // Find unique bets by timestamp
    const uniqueBets = bettedCandles.filter((bet, index, self) => 
      index === self.findIndex(b => b.timestamp === bet.timestamp)
    );
    return uniqueBets.some(bet => bet.timestamp === timestamp);
  };

  // Get bet prediction for a candle - handle potential duplicates
  const getBetPrediction = (timestamp: number): Prediction | null => {
    // Find all bets for this timestamp
    const betsForTimestamp = bettedCandles.filter(bet => bet.timestamp === timestamp);
    // If there are multiple bets for the same timestamp, use the first one
    return betsForTimestamp.length > 0 ? betsForTimestamp[0].prediction : null;
  };

  // Check if a candle has a double bet on it - handle potential duplicates
  const isDoubleBet = (timestamp: number): boolean => {
    // Find all bets for this timestamp
    const betsForTimestamp = bettedCandles.filter(bet => bet.timestamp === timestamp);
    // If there are multiple bets for the same timestamp, use the first one
    return betsForTimestamp.length > 0 ? !!betsForTimestamp[0].isDoubleBet : false;
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Get the candles to display (limit to last 50 for better visibility)
  // Ensure we don't have duplicates by timestamp
  const displayCandles = (() => {
    // Create a map to deduplicate candles by timestamp
    const candleMap = new Map<number, Candle>();
    
    // Add all candles to the map, with the latest version of each timestamp
    allCandles.forEach(candle => {
      candleMap.set(candle.timestamp, candle);
    });
    
    // Convert back to array and sort by timestamp
    const uniqueCandles = Array.from(candleMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Return the last 50 candles
    return uniqueCandles.slice(-50);
  })();

  // Calculate EMA with period 10
  const calculateEMA = (data: Candle[], period: number = 10): number[] => {
    const ema: number[] = [];
    const k = 2 / (period + 1);

    // Calculate initial SMA (Simple Moving Average)
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i].close;
    }
    ema.push(sum / period);

    // Calculate EMA for the rest of the data
    for (let i = period; i < data.length; i++) {
      ema.push(data[i].close * k + ema[i - period] * (1 - k));
    }

    return ema;
  };

  // Calculate EMA for all available candles to make the line longer
  let emaLine = "";
  if (allCandles.length >= 10) {
    // Use all candles for EMA calculation to make it longer
    // Explicitly using period 10 for EMA calculation
    const emaPeriod = 10;
    const emaValues = calculateEMA(allCandles, emaPeriod);
    
    // Create the path for the EMA line, but only display for visible candles
    const visibleStartIndex = Math.max(0, allCandles.length - displayCandles.length);
    
    emaLine = displayCandles.reduce((path, candle, index) => {
      const globalIndex = visibleStartIndex + index;
      if (globalIndex < emaPeriod - 1) return path; // Skip the first (period-1) candles as EMA starts from the period-th
      
      const x = index * (candleWidth + spacing) + spacing / 2 + calculatedXOffset + candleWidth / 2;
      const y = priceToY(emaValues[globalIndex - (emaPeriod - 1)]); // Adjust index for EMA values
      
      return path + (path === "" ? `M ${x},${y} ` : `L ${x},${y} `);
    }, "");
  }

  return (
    <View style={styles.container} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Draw price grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, index) => {
          const y = chartHeight * ratio;
          const price = effectiveMaxPrice - (effectivePriceRange * ratio);
          return (
            <React.Fragment key={`grid-${index}`}>
              <Line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#333"
                strokeWidth={0.5}
                strokeDasharray="5,5"
              />
              <SvgText
                x={5}
                y={y - 5}
                fill="#ffffff"
                fontSize={10}
                opacity={0.7}
              >
                ${price.toFixed(1)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Draw EMA-10 line FIRST (behind candles) */}
        {emaLine && (
          <Path
            d={emaLine}
            stroke="#f7931a" // Gold color similar to buttons
            strokeWidth={1}
            fill="none"
          />
        )}

        {/* Draw candles AFTER the EMA line */}
        {displayCandles.map((candle, index) => {
          // Calculate x position with offset for centering
          const x = index * (candleWidth + spacing) + spacing / 2 + calculatedXOffset;
          
          // Skip if candle is outside visible area
          if (x + candleWidth < 0 || x > chartWidth) return null;
          
          const open = priceToY(candle.open);
          const close = priceToY(candle.close);
          const high = priceToY(candle.high);
          const low = priceToY(candle.low);
          
          const isBullish = candle.close > candle.open;
          const candleColor = isBullish ? '#16a34a' : '#dc2626';
          
          // Determine if this candle is part of a highlighted pattern
          const isHighlighted = highlightPattern && 
            index >= highlightPattern.startIndex && 
            index <= highlightPattern.endIndex;
          
          // Determine if this is the current forming candle
          // Check both position and isClosed flag
          const isCurrentCandle = (
            (currentCandle && candle.timestamp === currentCandle.timestamp) || 
            (index === displayCandles.length - 1 && !candle.isClosed)
          );
          
          // Check if this candle has a bet on it
          const hasBet = isBettedCandle(candle.timestamp);
          const betPrediction = getBetPrediction(candle.timestamp);
          const hasDoubleBet = isDoubleBet(candle.timestamp);
          
          // Determine bet marker color based on prediction
          const betMarkerColor = betPrediction === 'bull' ? '#16a34a' : '#dc2626';
          const betMarkerEmoji = betPrediction === 'bull' ? '🐂' : '🐻';
          
          return (
            <React.Fragment key={`candle-${candle.timestamp}-${index}`}>
              {/* Timestamp label for the candle */}
              {index % 5 === 0 && (
                <SvgText
                  x={x + candleWidth / 2}
                  y={chartHeight - 5}
                  fill="#ffffff"
                  fontSize={8}
                  textAnchor="middle"
                  opacity={0.7}
                >
                  {formatTimestamp(candle.timestamp)}
                </SvgText>
              )}
              
              {/* Wick */}
              <Line
                x1={x + candleWidth / 2}
                y1={high}
                x2={x + candleWidth / 2}
                y2={low}
                stroke={candleColor}
                strokeWidth={1.5} // Keep this at 1.5 for better visibility
              />
              
              {/* Body */}
              <Rect
                x={x}
                y={Math.min(open, close)}
                width={candleWidth}
                height={Math.max(Math.abs(close - open), 1)}
                fill={candleColor}
                stroke={isHighlighted ? '#f59e0b' : candleColor}
                strokeWidth={isHighlighted ? 2 : 1}
                opacity={isCurrentCandle ? 0.7 : 1}
              />
              
              {/* Highlight for current candle - MODIFIED: thinner line (1px) and white color */}
              {isCurrentCandle && (
                <Rect
                  x={x - 2}
                  y={Math.min(open, close) - 2}
                  width={candleWidth + 4}
                  height={Math.abs(close - open) + 4 || 5}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
              )}
              
              {/* Bet marker - Now positioned ABOVE the candle instead of below */}
              {hasBet && (
                <>
                  {/* For double bets, show two circles stacked */}
                  {hasDoubleBet ? (
                    <>
                      {/* Bottom circle (slightly offset) */}
                      <Circle
                        cx={x + candleWidth / 2}
                        cy={high - 15}
                        r={6}
                        fill={betMarkerColor}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                      <SvgText
                        x={x + candleWidth / 2}
                        y={high - 12}
                        fill="#ffffff"
                        fontSize={8}
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {betMarkerEmoji}
                      </SvgText>
                      
                      {/* Top circle */}
                      <Circle
                        cx={x + candleWidth / 2}
                        cy={high - 28} 
                        r={6}
                        fill={betMarkerColor}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                      {/* Emoji in top circle */}
                      <SvgText
                        x={x + candleWidth / 2}
                        y={high - 25}
                        fill="#ffffff"
                        fontSize={8}
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {betMarkerEmoji}
                      </SvgText>
                    </>
                  ) : (
                    <>
                      {/* Single circle for regular bets */}
                      <Circle
                        cx={x + candleWidth / 2}
                        cy={high - 15}
                        r={6}
                        fill={betMarkerColor}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                      <SvgText
                        x={x + candleWidth / 2}
                        y={high - 12}
                        fill="#ffffff"
                        fontSize={8}
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {betMarkerEmoji}
                      </SvgText>
                    </>
                  )}
                </>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 8, // Reduced padding to align better with left margin
    marginVertical: 2, // Reduced from 10 to 2 to minimize the gap between text and chart
    height: 320, // Maintained at 320px as requested
    marginHorizontal: 0, // Removed horizontal margin to align with left edge
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CandleChart;
