import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME;

const ISRG_ROOT_X1 = `-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----`;

const poolConfig = {
  host,
  port,
  user,
  password,
  database,
  ssl: {
    ca: ISRG_ROOT_X1,
    rejectUnauthorized: false
  }
};

async function addColumnIfNotExists(connection, tableName, columnName, columnDefinition) {
  try {
    const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
    const exists = columns.some(col => col.Field === columnName);
    if (!exists) {
      console.log(`Adding column ${columnName} to table ${tableName}...`);
      await connection.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`);
    } else {
      console.log(`Column ${columnName} already exists in table ${tableName}.`);
    }
  } catch (err) {
    console.error(`Error processing table ${tableName}:`, err.message);
  }
}

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(poolConfig);
    console.log('✅ Connection SUCCESSFUL');

    // 1. Create schools table
    console.log('Creating schools table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        logo VARCHAR(255) NULL,
        theme_color VARCHAR(7) DEFAULT '#2563eb',
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Fetch default settings to initialize the default school
    console.log('Fetching existing branding settings...');
    const [settings] = await connection.execute("SELECT * FROM school_settings WHERE id = 1");
    let defaultSchoolName = 'Main Campus';
    let defaultSchoolLogo = null;
    let defaultSchoolTheme = '#2563eb';

    if (settings.length > 0) {
      defaultSchoolName = settings[0].school_name || 'Main Campus';
      defaultSchoolLogo = settings[0].school_logo || null;
      defaultSchoolTheme = settings[0].theme_color || '#2563eb';
    }

    // Check if default school already exists
    const [schools] = await connection.execute("SELECT id FROM schools WHERE id = 1");
    if (schools.length === 0) {
      console.log('Initializing default school...');
      await connection.execute(
        "INSERT INTO schools (id, name, logo, theme_color, status) VALUES (1, ?, ?, ?, 'Active')",
        [defaultSchoolName, defaultSchoolLogo, defaultSchoolTheme]
      );
      
      // Ensure school_settings also has matching id = 1 row
      const [settingsCheck] = await connection.execute("SELECT id FROM school_settings WHERE id = 1");
      if (settingsCheck.length === 0) {
        await connection.execute(
          "INSERT INTO school_settings (id, school_name, school_logo, theme_color) VALUES (1, ?, ?, ?)",
          [defaultSchoolName, defaultSchoolLogo, defaultSchoolTheme]
        );
      }
    }

    // 3. Add school_id column to required tables
    const tenantTables = [
      'users',
      'students',
      'rooms',
      'academic_programs',
      'subjects',
      'sections',
      'class_assignments',
      'fees_catalog',
      'scholarships_catalog',
      'landing_promotions',
      'notifications',
      'audit_logs'
    ];

    for (const table of tenantTables) {
      await addColumnIfNotExists(connection, table, 'school_id', 'INT DEFAULT 1');
    }

    console.log('✅ Migration COMPLETED successfully.');
  } catch (error) {
    console.error('❌ Migration FAILED!');
    console.error(error);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
