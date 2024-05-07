import { DataStore, setData } from './dataStore';
import fs from 'fs';

/**
 * Resets the state of the application back to the start.
 * Clears all user and quiz data and deletes the 'database.json' file.
 *
 * @returns {object} - Returns an empty object indicating successful state reset.
 */
export function clear(): object {
  const data: DataStore = {
    users: [],
    quizzes: [],
  };
  // Clears all user and quiz data
  setData(data);
  // Delete the 'database.json' file
  const filePath = 'database.json';
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error while deleting database.json', err);
    } else {
      console.log('database.json deleted successfully');
    }
  });
  // Returns an empty object
  return {};
}
