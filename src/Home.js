/* eslint-disable prettier/prettier */
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  Dimensions,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import RNFS from 'react-native-fs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Snackbar from 'react-native-snackbar';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Picker} from '@react-native-picker/picker';

const Home = () => {
  const [selectedInputType, setSelectedInputType] = useState('html');
  const [htmlContent, setHtmlContent] = useState('');
  const [base64ImageData, setBase64ImageData] = useState('');

  const checkPermissionNew = async base64Image => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 33) {
          // For Android 13 and above, we don't need to request storage permissions
          await downloadPDFFromBase64ImageNew(base64Image);
        } else if (Platform.Version >= 29) {
          // For Android 10-12, use READ_EXTERNAL_STORAGE
          const status = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
          await handlePermissionStatus(
            status,
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
            base64Image,
          );
        } else {
          // For Android 9 and below, use WRITE_EXTERNAL_STORAGE
          const status = await check(
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
          );
          await handlePermissionStatus(
            status,
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            base64Image,
          );
        }
      } catch (err) {
        console.warn('Permission check error:', err);
      }
    } else {
      // For iOS or other platforms
      await downloadPDFFromBase64ImageNew(base64Image);
    }
  };

  const handlePermissionStatus = async (status, permission, base64Image) => {
    switch (status) {
      case RESULTS.GRANTED:
        await downloadPDFFromBase64ImageNew(base64Image);
        break;
      case RESULTS.DENIED:
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          await downloadPDFFromBase64ImageNew(base64Image);
        } else {
          showPermissionDeniedAlertNew();
        }
        break;
      case RESULTS.BLOCKED:
        showPermissionDeniedAlertNew();
        break;
    }
  };

  const showPermissionDeniedAlertNew = () => {
    Alert.alert(
      'Storage Permission Required',
      'Storage permission is required to download the PDF. Please enable it in app settings.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
      {cancelable: false},
    );
  };

  const getRandomIntNew = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const downloadPDFFromBase64ImageNew = async base64Image => {
    try {
      const margin = 20; // in pixels

      let contentToUse;

      if (selectedInputType === 'html') {
        contentToUse = htmlContent.trim();
        if (!contentToUse) {
          Alert.alert('Error', 'Please enter HTML content.');
          return;
        }
      } else if (selectedInputType === 'image') {
        contentToUse = `
          <html>
           <body style="margin: ${margin}px;">
              <img src="data:image/jpeg;base64,${base64Image}"  />
            </body>
          </html>
        `;
        if (!base64Image.trim()) {
          Alert.alert('Error', 'Please enter Base64 image data.');
          return;
        }
      }

      //   const htmlContent = `
      //     <html>
      //       <body style="margin: ${margin}px;">
      //         <img src="${base64Image}" style="width: 100%; height: auto;" />
      //       </body>
      //     </html>
      //   `;

      const randomValue = getRandomIntNew(1, 500);
      const fileName = `example${selectedInputType}_${randomValue}.pdf`;

      const options = {
        html: contentToUse,
        fileName: fileName,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      if (Platform.OS === 'android' && Platform.Version >= 29) {
        // For Android 10 and above
        const android = require('react-native').NativeModules.RNAndroidStore;
        if (android && android.saveFileToDownloads) {
          const uri = await android.saveFileToDownloads(
            file.filePath,
            'application/pdf',
            fileName,
          );
          console.log('PDF saved to Downloads:', uri);
        } else {
          throw new Error('RNAndroidStore module not found');
        }
      } else {
        // For iOS and Android 9 and below
        const pdfPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        await RNFS.moveFile(file.filePath, pdfPath);
        console.log('PDF created successfully:', pdfPath);
      }

      Snackbar.show({
        text: 'Download Complete!',
        duration: Snackbar.LENGTH_SHORT,
      });
    } catch (error) {
      console.error('Error creating PDF:', error);
      Alert.alert('Error', 'Failed to create PDF');
    }
  };

  const handleGeneratePDF = () => {
    // Function to handle button press
    checkPermissionNew(base64ImageData);
  };
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Download HTML to PDF or Image to PDF</Text>

      <Picker
        selectedValue={selectedInputType}
        style={styles.picker}
        onValueChange={itemValue => setSelectedInputType(itemValue)}>
        <Picker.Item label="Enter HTML Code" value="html" />
        <Picker.Item label="Enter Base64 Image" value="image" />
      </Picker>

      {selectedInputType === 'html' && (
        <TextInput
          style={styles.textInput}
          placeholder="Enter your HTML code here"
          multiline
          value={htmlContent}
          onChangeText={setHtmlContent}
        />
      )}

      {selectedInputType === 'image' && (
        <TextInput
          style={styles.textInput}
          placeholder="Enter Base64 image data here"
          multiline
          value={base64ImageData}
          onChangeText={setBase64ImageData}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleGeneratePDF}>
        <Text style={styles.buttonText}>Generate PDF</Text>
      </TouchableOpacity>
    </View>
  );
};
const {width, height} = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  picker: {
    height: 50,
    width: width * 0.9,
    marginBottom: 20,
  },
  textInput: {
    width: width * 0.9,
    height: 150,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  button: {
    width: width * 0.8,
    paddingVertical: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Home;
