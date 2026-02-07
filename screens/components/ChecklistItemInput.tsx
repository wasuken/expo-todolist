import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';

interface ChecklistItemInputProps {
  value: string;
  taskIndex: number;
  itemIndex: number;
  onChecklistItemChange: (taskIndex: number, itemIndex: number, text: string) => void;
  onRemove: (taskIndex: number, itemIndex: number) => void;
}

const ChecklistItemInput: React.FC<ChecklistItemInputProps> = ({
  value,
  taskIndex,
  itemIndex,
  onChecklistItemChange,
  onRemove,
}) => {
  return (
    <View style={styles.checklistItemRow}>
      <TextInput
        dense
        value={value}
        onChangeText={text => onChecklistItemChange(taskIndex, itemIndex, text)}
        style={styles.checklistItemInput}
        autoComplete="off"
        autoCorrect={false}
      />
      <IconButton icon="close" size={16} onPress={() => onRemove(taskIndex, itemIndex)} />
    </View>
  );
};

export default ChecklistItemInput;

const styles = StyleSheet.create({
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistItemInput: {
    flex: 1,
    fontSize: 14,
    height: 32,
  },
});
