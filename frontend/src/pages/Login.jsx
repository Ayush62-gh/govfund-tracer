import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Landmark,
  Building,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldAlert,
  MapPin,
} from 'lucide-react';

// ── Role options shown in the dropdown ──────────────────────────────────────
// Only the 4 PS-defined roles. Admin is internal and not shown here.
const ROLE_OPTIONS = [
  {
    id: 'mp',
    label: 'Member of Parliament (MP)',
    icon: <Landmark className="w-4 h-4 text-orange-500" />,
    hint: 'sansad.nic.in government email',
    needsState: true,
    needsDistrict: false,
  },
  {
    id: 'district',
    label: 'District Authority',
    icon: <UserCheck className="w-4 h-4 text-emerald-500" />,
    hint: 'District collectorate NIC email',
    needsState: true,
    needsDistrict: true,
  },
  {
    id: 'state',
    label: 'State Nodal Authority (SNA)',
    icon: <Building className="w-4 h-4 text-blue-500" />,
    hint: 'State government MPLADS email',
    needsState: true,
    needsDistrict: false,
  },
  {
    id: 'ministry',
    label: 'Ministry / MoSPI',
    icon: <Shield className="w-4 h-4 text-purple-500" />,
    hint: 'mospi.gov.in ministry email',
    needsState: false,
    needsDistrict: false,
  },
];

// ── Indian states list for the State selector ────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar', 'Chandigarh', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

// ── Districts per state ───────────────────────────────────────────────────────
const STATE_DISTRICTS = {
  'Andhra Pradesh': [
    'Alluri Sitharama Raju','Anakapalli','Ananthapuramu','Annamayya','Bapatla',
    'Chittoor','East Godavari','Eluru','Guntur','Kakinada','Konaseema',
    'Krishna','Kurnool','Manyam','Nandyal','NTR','Palnadu','Prakasam',
    'Sri Sathya Sai','Srikakulam','Tirupati','Visakhapatnam','Vizianagaram',
    'West Godavari','YSR Kadapa',
  ],
  'Arunachal Pradesh': [
    'Anjaw','Changlang','Dibang Valley','East Kameng','East Siang',
    'Kamle','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit','Longding',
    'Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai','Pakke-Kessang',
    'Papum Pare','Shi Yomi','Siang','Tawang','Tirap','Upper Siang',
    'Upper Subansiri','West Kameng','West Siang',
  ],
  'Assam': [
    'Bajali','Baksa','Barpeta','Biswanath','Bongaigaon','Cachar','Charaideo',
    'Chirang','Darrang','Dhemaji','Dhubri','Dibrugarh','Dima Hasao',
    'Goalpara','Golaghat','Hailakandi','Hojai','Jorhat','Kamrup',
    'Kamrup Metropolitan','Karbi Anglong','Karimganj','Kokrajhar','Lakhimpur',
    'Majuli','Morigaon','Nagaon','Nalbari','Sivasagar','Sonitpur','South Salmara-Mankachar',
    'Tamulpur','Tinsukia','Udalguri','West Karbi Anglong',
  ],
  'Bihar': [
    'Araria','Arwal','Aurangabad','Banka','Begusarai','Bhagalpur','Bhojpur',
    'Buxar','Darbhanga','East Champaran','Gaya','Gopalganj','Jamui','Jehanabad',
    'Kaimur','Katihar','Khagaria','Kishanganj','Lakhisarai','Madhepura',
    'Madhubani','Munger','Muzaffarpur','Nalanda','Nawada','Patna','Purnia',
    'Rohtas','Saharsa','Samastipur','Saran','Sheikhpura','Sheohar','Sitamarhi',
    'Siwan','Supaul','Vaishali','West Champaran',
  ],
  'Chhattisgarh': [
    'Balod','Baloda Bazar','Balrampur','Bastar','Bemetara','Bijapur',
    'Bilaspur','Dantewada','Dhamtari','Durg','Gariaband','Gaurela-Pendra-Marwahi',
    'Janjgir-Champa','Jashpur','Kabirdham','Kanker','Khairagarh','Kondagaon',
    'Korba','Koriya','Mahasamund','Manendragarh','Mohla-Manpur','Mungeli',
    'Narayanpur','Raigarh','Raipur','Rajnandgaon','Sakti','Sarangarh-Bilaigarh',
    'Sukma','Surajpur','Surguja',
  ],
  'Goa': ['North Goa', 'South Goa'],
  'Gujarat': [
    'Ahmedabad','Amreli','Anand','Aravalli','Banaskantha','Bharuch',
    'Bhavnagar','Botad','Chhota Udaipur','Dahod','Dang','Devbhoomi Dwarka',
    'Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kheda','Kutch',
    'Mahisagar','Mehsana','Morbi','Narmada','Navsari','Panchmahal',
    'Patan','Porbandar','Rajkot','Sabarkantha','Surat','Surendranagar',
    'Tapi','Vadodara','Valsad',
  ],
  'Haryana': [
    'Ambala','Bhiwani','Charkhi Dadri','Faridabad','Fatehabad','Gurugram',
    'Hisar','Jhajjar','Jind','Kaithal','Karnal','Kurukshetra','Mahendragarh',
    'Nuh','Palwal','Panchkula','Panipat','Rewari','Rohtak','Sirsa',
    'Sonipat','Yamunanagar',
  ],
  'Himachal Pradesh': [
    'Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu',
    'Lahaul & Spiti','Mandi','Shimla','Sirmaur','Solan','Una',
  ],
  'Jharkhand': [
    'Bokaro','Chatra','Deoghar','Dhanbad','Dumka','East Singhbhum',
    'Garhwa','Giridih','Godda','Gumla','Hazaribagh','Jamtara',
    'Khunti','Koderma','Latehar','Lohardaga','Pakur','Palamu',
    'Ramgarh','Ranchi','Sahebganj','Seraikela Kharsawan','Simdega',
    'West Singhbhum',
  ],
  'Karnataka': [
    'Bagalkot','Ballari','Belagavi','Bengaluru Rural','Bengaluru Urban',
    'Bidar','Chamarajanagar','Chikkaballapur','Chikkamagaluru','Chitradurga',
    'Dakshina Kannada','Davangere','Dharwad','Gadag','Hassan','Haveri',
    'Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur',
    'Ramanagara','Shivamogga','Tumakuru','Udupi','Uttara Kannada',
    'Vijayapura','Yadgir',
  ],
  'Kerala': [
    'Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam',
    'Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta',
    'Thiruvananthapuram','Thrissur','Wayanad',
  ],
  'Madhya Pradesh': [
    'Agar Malwa','Alirajpur','Anuppur','Ashoknagar','Balaghat','Barwani',
    'Betul','Bhind','Bhopal','Burhanpur','Chhatarpur','Chhindwara',
    'Damoh','Datia','Dewas','Dhar','Dindori','Guna','Gwalior','Harda',
    'Hoshangabad','Indore','Jabalpur','Jhabua','Katni','Khandwa',
    'Khargone','Mandla','Mandsaur','Morena','Narsinghpur','Neemuch',
    'Niwari','Panna','Raisen','Rajgarh','Ratlam','Rewa','Sagar',
    'Satna','Sehore','Seoni','Shahdol','Shajapur','Sheopur','Shivpuri',
    'Sidhi','Singrauli','Tikamgarh','Ujjain','Umaria','Vidisha',
  ],
  'Maharashtra': [
    'Ahmednagar','Akola','Amravati','Aurangabad','Beed','Bhandara',
    'Buldhana','Chandrapur','Dhule','Gadchiroli','Gondia','Hingoli',
    'Jalgaon','Jalna','Kolhapur','Latur','Mumbai City','Mumbai Suburban',
    'Nagpur','Nanded','Nandurbar','Nashik','Osmanabad','Palghar',
    'Parbhani','Pune','Raigad','Ratnagiri','Sangli','Satara',
    'Sindhudurg','Solapur','Thane','Wardha','Washim','Yavatmal',
  ],
  'Manipur': [
    'Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West',
    'Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl',
    'Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul',
  ],
  'Meghalaya': [
    'East Garo Hills','East Jaintia Hills','East Khasi Hills',
    'Eastern West Khasi Hills','North Garo Hills','Ri Bhoi',
    'South Garo Hills','South West Garo Hills','South West Khasi Hills',
    'West Garo Hills','West Jaintia Hills','West Khasi Hills',
  ],
  'Mizoram': [
    'Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib','Lawngtlai',
    'Lunglei','Mamit','Saitual','Serchhip',
  ],
  'Nagaland': [
    'Chumoukedima','Dimapur','Kiphire','Kohima','Longleng','Mokokchung',
    'Mon','Niuland','Noklak','Peren','Phek','Shamator','Tseminyu',
    'Tuensang','Wokha','Zunheboto',
  ],
  'Odisha': [
    'Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh',
    'Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur',
    'Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar',
    'Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur',
    'Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Sonepur','Sundargarh',
  ],
  'Punjab': [
    'Amritsar','Barnala','Bathinda','Faridkot','Fatehgarh Sahib',
    'Fazilka','Ferozepur','Gurdaspur','Hoshiarpur','Jalandhar','Kapurthala',
    'Ludhiana','Malerkotla','Mansa','Moga','Mohali','Muktsar','Pathankot',
    'Patiala','Rupnagar','Sangrur','Shaheed Bhagat Singh Nagar','Tarn Taran',
  ],
  'Rajasthan': [
    'Ajmer','Alwar','Banswara','Baran','Barmer','Bharatpur','Bhilwara',
    'Bikaner','Bundi','Chittorgarh','Churu','Dausa','Dholpur','Dungarpur',
    'Ganganagar','Hanumangarh','Jaipur','Jaisalmer','Jalore','Jhalawar',
    'Jhunjhunu','Jodhpur','Karauli','Kota','Nagaur','Pali','Pratapgarh',
    'Rajsamand','Sawai Madhopur','Sikar','Sirohi','Tonk','Udaipur',
  ],
  'Sikkim': ['East Sikkim','North Sikkim','Pakyong','Soreng','South Sikkim','West Sikkim'],
  'Tamil Nadu': [
    'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri',
    'Dindigul','Erode','Kallakurichi','Kanchipuram','Kanyakumari','Karur',
    'Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal',
    'Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet',
    'Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi',
    'Tiruchirappalli','Tirunelveli','Tirupattur','Tiruppur','Tiruvallur',
    'Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar',
  ],
  'Telangana': [
    'Adilabad','Bhadradri Kothagudem','Hanamkonda','Hyderabad','Jagtial',
    'Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy',
    'Karimnagar','Khammam','Kumuram Bheem','Mahabubabad','Mahbubnagar',
    'Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool',
    'Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla',
    'Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad',
    'Wanaparthy','Warangal','Yadadri Bhuvanagiri',
  ],
  'Tripura': [
    'Dhalai','Gomati','Khowai','North Tripura','Sepahijala',
    'Sipahijala','South Tripura','Unakoti','West Tripura',
  ],
  'Uttar Pradesh': [
    'Agra','Aligarh','Ambedkar Nagar','Amethi','Amroha','Auraiya',
    'Ayodhya','Azamgarh','Baghpat','Bahraich','Ballia','Balrampur',
    'Banda','Barabanki','Bareilly','Basti','Bhadohi','Bijnor',
    'Budaun','Bulandshahr','Chandauli','Chitrakoot','Deoria','Etah',
    'Etawah','Farrukhabad','Fatehpur','Firozabad','Gautam Buddha Nagar',
    'Ghaziabad','Ghazipur','Gonda','Gorakhpur','Hamirpur','Hapur',
    'Hardoi','Hathras','Jalaun','Jaunpur','Jhansi','Kannauj',
    'Kanpur Dehat','Kanpur Nagar','Kasganj','Kaushambi','Kushinagar',
    'Lakhimpur Kheri','Lalitpur','Lucknow','Mahoba','Maharajganj',
    'Mainpuri','Mathura','Mau','Meerut','Mirzapur','Moradabad',
    'Muzaffarnagar','Pilibhit','Pratapgarh','Prayagraj','Raebareli',
    'Rampur','Saharanpur','Sambhal','Sant Kabir Nagar','Shahjahanpur',
    'Shamli','Shravasti','Siddharthnagar','Sitapur','Sonbhadra',
    'Sultanpur','Unnao','Varanasi',
  ],
  'Uttarakhand': [
    'Almora','Bageshwar','Chamoli','Champawat','Dehradun',
    'Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag',
    'Tehri Garhwal','Udham Singh Nagar','Uttarkashi',
  ],
  'West Bengal': [
    'Alipurduar','Bankura','Birbhum','Cooch Behar','Dakshin Dinajpur',
    'Darjeeling','Hooghly','Howrah','Jalpaiguri','Jhargram','Kalimpong',
    'Kolkata','Malda','Murshidabad','Nadia','North 24 Parganas',
    'Paschim Bardhaman','Paschim Medinipur','Purba Bardhaman','Purba Medinipur',
    'Purulia','South 24 Parganas','Uttar Dinajpur',
  ],
  'Andaman & Nicobar': ['Nicobar','North & Middle Andaman','South Andaman'],
  'Chandigarh': ['Chandigarh'],
  'Delhi': [
    'Central Delhi','East Delhi','New Delhi','North Delhi','North East Delhi',
    'North West Delhi','Shahdara','South Delhi','South East Delhi',
    'South West Delhi','West Delhi',
  ],
  'Jammu & Kashmir': [
    'Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal',
    'Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama',
    'Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur',
  ],
  'Ladakh': ['Kargil','Leh'],
  'Lakshadweep': ['Lakshadweep'],
  'Puducherry': ['Karaikal','Mahe','Puducherry','Yanam'],
};

// ── Demo credentials for testing ─────────────────────────────────────────────
const DEMO_CREDENTIALS = [
  {
    roleId: 'mp',
    role: 'MP',
    email: 'rajeshwar.mp@sansad.nic.in',
    password: 'MP@Varanasi2024',
    state: 'Uttar Pradesh',
    district: '',
    label: 'Dr. Rajeshwar Sharma (Varanasi)',
  },
  {
    roleId: 'mp',
    role: 'MP',
    email: 'supriya.mp@sansad.nic.in',
    password: 'MP@Baramati2024',
    state: 'Maharashtra',
    district: '',
    label: 'Smt. Supriya Sule (Baramati)',
  },
  {
    roleId: 'mp',
    role: 'MP',
    email: 'ravishankar.mp@sansad.nic.in',
    password: 'MP@Patna2024',
    state: 'Bihar',
    district: '',
    label: 'Shri Ravi Shankar Prasad (Patna Sahib)',
  },
  {
    roleId: 'district',
    role: 'District',
    email: 'dm-varanasi@nic.in',
    password: 'DM@Varanasi2024',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    label: 'DM Varanasi — Shri S. Rajalingam, IAS',
  },
  {
    roleId: 'district',
    role: 'District',
    email: 'dm-patna@nic.in',
    password: 'DM@Patna2024',
    state: 'Bihar',
    district: 'Patna',
    label: 'DM Patna — Dr. Chandrashekhar Singh, IAS',
  },
  {
    roleId: 'state',
    role: 'State',
    email: 'sna.mplads@up.gov.in',
    password: 'SNA@UP2024',
    state: 'Uttar Pradesh',
    district: '',
    label: 'SNA Uttar Pradesh — Smt. Aradhana Shukla, IAS',
  },
  {
    roleId: 'state',
    role: 'State',
    email: 'sna.mplads@bihar.gov.in',
    password: 'SNA@Bihar2024',
    state: 'Bihar',
    district: '',
    label: 'SNA Bihar — Shri Pratyaya Amrit, IAS',
  },
  {
    roleId: 'ministry',
    role: 'Ministry',
    email: 'js-mplads@mospi.gov.in',
    password: 'MoSPI@Ministry24',
    state: '',
    district: '',
    label: 'JS (MPLADS), MoSPI — Shri Alok Kumar Verma',
  },
];

// Role badge colours
const ROLE_BADGE = {
  mp:       'bg-orange-900/60 text-orange-300',
  district: 'bg-emerald-900/60 text-emerald-300',
  state:    'bg-blue-900/60 text-blue-300',
  ministry: 'bg-purple-900/60 text-purple-300',
};

/**
 * Login Page — One common login page for all four PS-defined roles.
 *
 * Form fields:
 *  1. Role
 *  2. State   (shown for MP, District Authority, State SNA)
 *  3. District (shown for District Authority only)
 *  4. Email / User ID
 *  5. Password
 *
 * The role selected on the frontend is sent to the backend but the backend
 * cross-verifies it against the stored credential record and rejects mismatches
 * with HTTP 403 ROLE_MISMATCH.
 */
export const Login = () => {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const dropRef    = useRef(null);

  const [selectedRole,  setSelectedRole]  = useState('mp');
  const [selectedState, setSelectedState] = useState('');
  const [district,      setDistrict]      = useState('');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');
  const [errorCode,     setErrorCode]     = useState('');
  const [roleDropOpen,  setRoleDropOpen]  = useState(false);
  const [showDemo,      setShowDemo]      = useState(false);

  const activeRole = ROLE_OPTIONS.find(r => r.id === selectedRole);
  const from = location.state?.from?.pathname;

  // Close role dropdown when clicking outside
  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setRoleDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Clear state/district when role changes
  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setSelectedState('');
    setDistrict('');
    setError('');
    setRoleDropOpen(false);
  };

  const clearError = () => { setError(''); setErrorCode(''); };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = () => {
    if (activeRole?.needsState && !selectedState) {
      setError('Please select your State.');
      return false;
    }
    if (activeRole?.needsDistrict && !district.trim()) {
      setError('Please enter your assigned District.');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your government email or NIC User ID.');
      return false;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email address (e.g. dm-varanasi@nic.in).');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  // ── Login submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Backend verifies: email exists → password correct → role matches stored role → state matches stored state
      const result = await login(email.trim(), password, selectedRole, selectedState);
      if (!result.ok) {
        setError(result.error);
        setErrorCode(result.code || '');
        return;
      }
      const target = (from && from !== '/login') ? from : result.dashboardPath;
      navigate(target, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fill from demo panel ─────────────────────────────────────────────────
  const fillDemo = (cred) => {
    setSelectedRole(cred.roleId);
    setSelectedState(cred.state || '');
    setDistrict(cred.district || '');
    setEmail(cred.email);
    setPassword(cred.password);
    clearError();
    setShowDemo(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-blue-950 text-white flex flex-col">
      {/* Government Tricolor */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[480px] relative">
          {/* Ambient glows */}
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

            <div className="p-7 sm:p-8">
              {/* ── Branding ── */}
              <div className="text-center mb-7">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30 mb-4">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 4a3 3 0 110 6 3 3 0 010-6zm0 13c-2.7 0-5.8-1.29-6-2.5V16c1.8-1.5 3.9-2 6-2s4.2.5 6 2v.5c-.2 1.21-3.3 2.5-6 2.5z" />
                  </svg>
                </div>
                <h1 className="text-xl font-extrabold font-display tracking-tight text-white">
                  MPLADS <span className="text-orange-400">e-Samiksha</span> AI
                </h1>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ministry of Statistics &amp; Programme Implementation — Government of India
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>NIC Secure Authentication — Active</span>
                </div>
              </div>

              {/* ── LOGIN FORM ── */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* 1. Role */}
                <div ref={dropRef} className="relative">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Role
                  </label>
                  <button
                    type="button"
                    id="role-dropdown-btn"
                    onClick={() => setRoleDropOpen(p => !p)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 hover:border-slate-500 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {activeRole?.icon}
                      <span className="text-sm font-semibold text-white truncate">{activeRole?.label}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${roleDropOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {roleDropOpen && (
                    <div className="absolute top-full mt-1.5 left-0 right-0 z-30 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
                      {ROLE_OPTIONS.map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleRoleChange(opt.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                            selectedRole === opt.id
                              ? 'bg-blue-900/60 text-white'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {opt.icon}
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{opt.label}</div>
                            <div className="text-[10px] text-slate-500 truncate">{opt.hint}</div>
                          </div>
                          {selectedRole === opt.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-400 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. State — shown for MP, District, State roles */}
                {activeRole?.needsState && (
                  <div>
                    <label htmlFor="login-state" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      State
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="login-state"
                        value={selectedState}
                        onChange={e => { setSelectedState(e.target.value); setDistrict(''); clearError(); }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                      >
                        <option value="" disabled className="text-slate-500">Select State / UT</option>
                        {INDIAN_STATES.map(s => (
                          <option key={s} value={s} className="bg-slate-800">{s}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* 3. District — dropdown populated from selected state */}
                {activeRole?.needsDistrict && (
                  <div>
                    <label htmlFor="login-district" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      District
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        id="login-district"
                        value={district}
                        disabled={!selectedState}
                        onChange={e => { setDistrict(e.target.value); clearError(); }}
                        className={`w-full pl-10 pr-8 py-3 rounded-xl bg-slate-800 border text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors ${
                          !selectedState
                            ? 'border-slate-700 text-slate-600 cursor-not-allowed opacity-60'
                            : 'border-slate-600 text-white cursor-pointer'
                        }`}
                      >
                        <option value="" disabled className="text-slate-500">
                          {selectedState ? 'Select District' : '— Select a state first —'}
                        </option>
                        {(STATE_DISTRICTS[selectedState] || []).map(d => (
                          <option key={d} value={d} className="bg-slate-800">{d}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {!selectedState && (
                      <p className="mt-1 text-[10px] text-amber-500/80 px-1">Select your state first to load the district list.</p>
                    )}
                  </div>
                )}

                {/* 4. Email / User ID */}
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email / NIC User ID
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="user@nic.in"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearError(); }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 5. Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your secure password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); clearError(); }}
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
                    errorCode === 'ROLE_MISMATCH'
                      ? 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                      : 'bg-red-950/50 border-red-700/60 text-red-300'
                  }`}>
                    {errorCode === 'ROLE_MISMATCH'
                      ? <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    }
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating via NIC Gateway...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Secure Login</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <Lock className="w-3.5 h-3.5" />
                <span>NIC Secure Access • Role-verified • Session-audited</span>
              </div>
            </div>

            {/* ── Demo Credentials Panel ── */}
            <div className="border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowDemo(p => !p)}
                className="w-full flex items-center justify-between px-6 py-3.5 text-[11px] text-slate-400 hover:text-slate-300 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="font-semibold uppercase tracking-wide">Demo Credentials (Testing Only)</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
              </button>

              {showDemo && (
                <div className="px-5 pb-5 space-y-1.5">
                  <p className="text-[10px] text-slate-500 mb-2.5 leading-relaxed">
                    Click any row to auto-fill all fields. The backend still verifies role ↔ credential match and rejects mismatches with 403.
                  </p>
                  {DEMO_CREDENTIALS.map((cred, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => fillDemo(cred)}
                      className="w-full text-left px-3 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-slate-200 truncate">{cred.label}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{cred.email}</div>
                          {cred.state && (
                            <div className="text-[9px] text-slate-500 mt-0.5">
                              {cred.state}{cred.district ? ` › ${cred.district}` : ''}
                            </div>
                          )}
                        </div>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${ROLE_BADGE[cred.roleId]}`}>
                          {cred.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 px-6 text-center text-[11px] text-slate-600 border-t border-slate-800/50">
        © 2026 Ministry of Statistics and Programme Implementation (MoSPI), Government of India. All rights reserved.
        &nbsp;•&nbsp; Powered by NIC Cloud Infrastructure
      </footer>
    </div>
  );
};

export default Login;
