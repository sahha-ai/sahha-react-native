import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sahha from 'sahha-react-native';

export default function ProfileView() {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('male');

  useEffect(() => {
    console.log('profile');
    getPrefs();
  }, []);

  const getPrefs = async () => {
    try {
      const _age = await AsyncStorage.getItem('@age');
      if (_age !== null) {
        setAge(_age);
      }
      const _gender = await AsyncStorage.getItem('@gender');
      if (_gender !== null) {
        setGender(_gender);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setPrefs = async () => {
    try {
      await AsyncStorage.setItem('@age', age);
      await AsyncStorage.setItem('@gender', gender);
    } catch (error) {
      console.error(error);
    }
  };

  const savePrefs = () => {
    setPrefs();

    const demographic = {
      age: age,
      gender: gender,
    };

    Sahha.postDemographic(demographic, (error, success) => {
      if (error) {
        console.error(`Error: ${error}`);
      } else if (success) {
        console.log(`Success: ${success}`);
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text>AGE</Text>
      <TextInput
        style={styles.input}
        keyboardType="numbers-and-punctuation"
        maxLength={3}
        onChangeText={(value) => {
          let ageInt = parseInt(value);
          if (ageInt) {
            console.log(ageInt.toString());
            setAge(ageInt.toString());
          } else {
            console.log('bad int');
            setAge('');
          }
        }}
        value={age}
        placeholder="1 - 100"
      />
      <View style={styles.divider} />
      <Text>GENDER</Text>
      <Picker
        style={{ height: 200, width: '80%' }}
        selectedValue={gender}
        onValueChange={(itemValue) => {
          setGender(itemValue);
        }}
      >
        <Picker.Item label="Male" value={'male'} />
        <Picker.Item label="Female" value={'female'} />
        <Picker.Item label="Gender Diverse" value={'gender diverse'} />
      </Picker>
      <Button title="SAVE" onPress={savePrefs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    margin: 20,
    width: '80%',
    backgroundColor: '#cccccc',
  },
  input: {
    height: 40,
    margin: 12,
    width: '80%',
    borderWidth: 1,
    padding: 10,
  },
});
