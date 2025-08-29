// FOR CALCULATOR APP

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Vibration,
} from 'react-native';

const { width } = Dimensions.get('window');

const CalculatorApp = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  type HistoryEntry = { id: number; calculation: string };
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const inputNumber = (num: number) => {
    Vibration.vibrate(50); // Haptic feedback
    
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputDecimal = () => {
    Vibration.vibrate(50);
    
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    Vibration.vibrate(100);
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    Vibration.vibrate(50);
    
    if (display.length > 1 && display !== '0') {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const performOperation = (nextOperation: string) => {
    Vibration.vibrate(50);
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      // Add to history
      const historyEntry = {
        id: Date.now(),
        calculation: `${formatNumber(currentValue)} ${operation} ${formatNumber(inputValue)} = ${formatNumber(newValue)}`,
      };
      setHistory(prev => [historyEntry, ...prev.slice(0, 19)]); // Keep last 20 entries

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const percentage = () => {
    Vibration.vibrate(50);
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const toggleSign = () => {
    Vibration.vibrate(50);
    if (display !== '0') {
      setDisplay(display.charAt(0) === '-' ? display.slice(1) : '-' + display);
    }
  };

  const formatNumber = (num: number) => {
    if (num % 1 === 0) {
      return num.toString();
    }
    return parseFloat(num.toFixed(8)).toString();
  };

  const formatDisplay = (value: string) => {
    if (value.length > 12) {
      return parseFloat(value).toExponential(5);
    }
    return value;
  };

  type ButtonProps = {
    onPress: () => void;
    title: string;
    type?: 'number' | 'operator' | 'function' | 'equals' | 'clear';
    style?: object;
    textStyle?: object;
    disabled?: boolean;
  };

  const Button: React.FC<ButtonProps> = ({ 
    onPress, 
    title, 
    type = 'number',
    style,
    textStyle,
    disabled = false 
  }) => {
    const getButtonStyle = () => {
      switch (type) {
        case 'operator':
          return [styles.button, styles.operatorButton, style];
        case 'function':
          return [styles.button, styles.functionButton, style];
        case 'equals':
          return [styles.button, styles.equalsButton, style];
        case 'clear':
          return [styles.button, styles.clearButton, style];
        default:
          return [styles.button, styles.numberButton, style];
      }
    };

    const getTextStyle = () => {
      switch (type) {
        case 'operator':
        case 'equals':
          return [styles.buttonText, styles.operatorText, textStyle];
        case 'function':
          return [styles.buttonText, styles.functionText, textStyle];
        case 'clear':
          return [styles.buttonText, styles.clearText, textStyle];
        default:
          return [styles.buttonText, textStyle];
      }
    };

    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Calculator</Text>
        
        <TouchableOpacity
          style={styles.historyToggle}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.historyToggleText}>
            {showHistory ? 'Hide History' : 'Show History'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* History Panel */}
      {showHistory && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>History</Text>
          <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
            {history.length === 0 ? (
              <Text style={styles.noHistoryText}>No calculations yet</Text>
            ) : (
              history.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyText}>{item.calculation}</Text>
                </View>
              ))
            )}
          </ScrollView>
          {history.length > 0 && (
            <TouchableOpacity
              style={styles.clearHistoryButton}
              onPress={() => setHistory([])}
            >
              <Text style={styles.clearHistoryText}>Clear History</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.calculatorContainer}>
        {/* Display */}
        <View style={styles.displayContainer}>
          <View style={styles.operationDisplay}>
            <Text style={styles.operationText}>
              {previousValue !== null && operation ? 
                `${formatNumber(previousValue)} ${operation}` : 
                ''
              }
            </Text>
          </View>
          <View style={styles.mainDisplay}>
            <Text style={styles.displayText}>
              {formatDisplay(display)}
            </Text>
          </View>
        </View>

        {/* Button Grid */}
        <View style={styles.buttonsContainer}>
          {/* Row 1 */}
          <View style={styles.buttonRow}>
            <Button
              title="C"
              type="clear"
              onPress={clear}
              style={styles.wideButton}
            />
            <Button
              title="⌫"
              type="function"
              onPress={backspace}
            />
            <Button
              title="÷"
              type="operator"
              onPress={() => performOperation('÷')}
            />
          </View>

          {/* Row 2 */}
          <View style={styles.buttonRow}>
            <Button title="7" onPress={() => inputNumber(7)} />
            <Button title="8" onPress={() => inputNumber(8)} />
            <Button title="9" onPress={() => inputNumber(9)} />
            <Button
              title="×"
              type="operator"
              onPress={() => performOperation('×')}
            />
          </View>

          {/* Row 3 */}
          <View style={styles.buttonRow}>
            <Button title="4" onPress={() => inputNumber(4)} />
            <Button title="5" onPress={() => inputNumber(5)} />
            <Button title="6" onPress={() => inputNumber(6)} />
            <Button
              title="-"
              type="operator"
              onPress={() => performOperation('-')}
            />
          </View>

          {/* Row 4 */}
          <View style={styles.buttonRow}>
            <Button title="1" onPress={() => inputNumber(1)} />
            <Button title="2" onPress={() => inputNumber(2)} />
            <Button title="3" onPress={() => inputNumber(3)} />
            <Button
              title="+"
              type="operator"
              onPress={() => performOperation('+')}
            />
          </View>

          {/* Row 5 */}
          <View style={styles.buttonRow}>
            <Button
              title="±"
              type="function"
              onPress={toggleSign}
            />
            <Button title="0" onPress={() => inputNumber(0)} />
            <Button title="." onPress={inputDecimal} />
            <Button
              title="="
              type="equals"
              onPress={() => performOperation('=')}
            />
          </View>

          {/* Row 6 - Additional Functions */}
          <View style={styles.buttonRow}>
            <Button
              title="%"
              type="function"
              onPress={percentage}
              style={styles.wideButton}
            />
            <Button
              title="🗑️"
              type="function"
              onPress={() => setHistory([])}
              style={styles.wideButton}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 30,
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1f2937',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  historyToggle: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  historyToggleText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  historyContainer: {
    backgroundColor: '#1f2937',
    maxHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  historyTitle: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  historyScroll: {
    maxHeight: 120,
  },
  historyItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  historyText: {
    color: '#d1d5db',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  noHistoryText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 20,
  },
  clearHistoryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
  },
  clearHistoryText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calculatorContainer: {
    flex: 1,
    padding: 20,
  },
  displayContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  operationDisplay: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  operationText: {
    color: '#9ca3af',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  mainDisplay: {
    alignItems: 'flex-end',
  },
  displayText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '300',
    fontFamily: 'monospace',
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    width: (width - 60) / 4,
    height: 65,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  wideButton: {
    width: (width - 60) / 2 - 6,
  },
  numberButton: {
    backgroundColor: '#374151',
  },
  operatorButton: {
    backgroundColor: '#3b82f6',
  },
  functionButton: {
    backgroundColor: '#6b7280',
  },
  equalsButton: {
    backgroundColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  operatorText: {
    fontSize: 24,
  },
  functionText: {
    fontSize: 18,
  },
  clearText: {
    fontSize: 18,
  },
});

export default CalculatorApp;