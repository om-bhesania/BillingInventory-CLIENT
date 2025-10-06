import { Country, State, City } from 'country-state-city';

export interface AreaInfo {
  areaName: string;
  city: string;
  state: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface FlavorPerformance {
  flavorId: string;
  flavorName: string;
  totalSales: number;
  totalRevenue: number;
  shopCount: number;
  averagePrice: number;
}

export interface AreaAnalytics {
  areaName: string;
  city: string;
  state: string;
  totalShops: number;
  totalRevenue: number;
  topFlavors: FlavorPerformance[];
  lastUpdated: string;
}

class AreaAnalyticsService {
  // Get all Indian states
  getIndianStates() {
    const india = Country.getCountryByCode('IN');
    if (!india) return [];
    
    return State.getStatesOfCountry('IN').map(state => ({
      id: state.isoCode,
      name: state.name,
      countryCode: state.countryCode
    }));
  }

  // Get cities for a specific state
  getCitiesByState(stateCode: string) {
    return City.getCitiesOfState('IN', stateCode).map(city => ({
      id: city.name,
      name: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
      latitude: city.latitude,
      longitude: city.longitude
    }));
  }

  // Get areas for a specific city (we'll use a predefined list for major Indian cities)
  getAreasByCity(cityName: string): string[] {
    const areaMap: { [key: string]: string[] } = {
      'Vadodara': [
        'Gotri', 'Gorwa', 'Laxmipura', 'Manjulpur', 'Akota', 'Alkapuri', 
        'Sayajigunj', 'Fatehgunj', 'Raopura', 'Mandvi', 'Karelibaug',
        'Tandalja', 'Makarpura', 'Subhanpura', 'Harni', 'Vasna', 'Waghodia'
      ],
      'Ahmedabad': [
        'Vastrapur', 'Bodakdev', 'Satellite', 'Paldi', 'Navrangpura', 
        'C.G. Road', 'Maninagar', 'Vatva', 'Naroda', 'Bapunagar',
        'Isanpur', 'Juhapura', 'Sarkhej', 'Bopal', 'Thaltej', 'Gandhinagar'
      ],
      'Mumbai': [
        'Andheri', 'Bandra', 'Borivali', 'Chembur', 'Dadar', 'Goregaon',
        'Juhu', 'Kandivali', 'Kurla', 'Malad', 'Mulund', 'Powai',
        'Santacruz', 'Thane', 'Vashi', 'Worli', 'Dahisar', 'Ghatkopar'
      ],
      'Delhi': [
        'Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Rajouri Garden',
        'Pitampura', 'Rohini', 'Dwarka', 'Janakpuri', 'Uttam Nagar',
        'Vikaspuri', 'Paschim Vihar', 'Rohini', 'Shalimar Bagh', 'Azadpur'
      ],
      'Bangalore': [
        'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City',
        'Marathahalli', 'HSR Layout', 'JP Nagar', 'Banashankari',
        'Jayanagar', 'Malleshwaram', 'Rajajinagar', 'Vijayanagar'
      ],
      'Pune': [
        'Koregaon Park', 'Baner', 'Aundh', 'Hinjewadi', 'Wakad',
        'Pimpri', 'Chinchwad', 'Hadapsar', 'Kondhwa', 'Katraj'
      ],
      'Chennai': [
        'T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar', 'Mylapore',
        'Nungambakkam', 'Kilpauk', 'Aminjikarai', 'Saidapet', 'Guindy'
      ],
      'Kolkata': [
        'Park Street', 'Salt Lake', 'New Town', 'Ballygunge', 'Gariahat',
        'Dhakuria', 'Jadavpur', 'Tollygunge', 'Behala', 'Bhowanipore'
      ],
      'Hyderabad': [
        'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'HITEC City',
        'Kondapur', 'Madhapur', 'Kukatpally', 'Secunderabad', 'Begumpet'
      ],
      'Jaipur': [
        'C-Scheme', 'Bani Park', 'Vaishali Nagar', 'Mansarovar',
        'Vidhyadhar Nagar', 'Sitapura', 'Malviya Nagar', 'Raja Park'
      ]
    };

    return areaMap[cityName] || [];
  }

  // Get area information by zip code (approximate mapping)
  getAreaByZipCode(zipCode: string): AreaInfo | null {
    // This is a simplified mapping - in a real application, you'd use a proper zip code database
    const zipCodeMap: { [key: string]: AreaInfo } = {
      '390001': { areaName: 'Gotri', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390002': { areaName: 'Gorwa', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390003': { areaName: 'Laxmipura', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390004': { areaName: 'Manjulpur', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390005': { areaName: 'Akota', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390006': { areaName: 'Alkapuri', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390007': { areaName: 'Sayajigunj', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390008': { areaName: 'Fatehgunj', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390009': { areaName: 'Raopura', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390010': { areaName: 'Mandvi', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390011': { areaName: 'Karelibaug', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390012': { areaName: 'Tandalja', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390013': { areaName: 'Makarpura', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390014': { areaName: 'Subhanpura', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390015': { areaName: 'Harni', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390016': { areaName: 'Vasna', city: 'Vadodara', state: 'Gujarat', zipCode },
      '390017': { areaName: 'Waghodia', city: 'Vadodara', state: 'Gujarat', zipCode }
    };

    return zipCodeMap[zipCode] || null;
  }

  // Generate area analytics data (this would typically come from your backend)
  generateAreaAnalytics(areaInfo: AreaInfo, salesData: any[]): AreaAnalytics {
    // Group sales by flavor
    const flavorMap = new Map<string, FlavorPerformance>();
    
    salesData.forEach(sale => {
      const flavorId = sale.flavorId;
      const flavorName = sale.flavorName;
      
      if (!flavorMap.has(flavorId)) {
        flavorMap.set(flavorId, {
          flavorId,
          flavorName,
          totalSales: 0,
          totalRevenue: 0,
          shopCount: 0,
          averagePrice: 0
        });
      }
      
      const flavor = flavorMap.get(flavorId)!;
      flavor.totalSales += sale.quantity;
      flavor.totalRevenue += sale.amount;
      flavor.shopCount = Math.max(flavor.shopCount, sale.shopCount || 1);
    });

    // Calculate average prices
    flavorMap.forEach(flavor => {
      flavor.averagePrice = flavor.totalRevenue / flavor.totalSales;
    });

    // Sort by total revenue
    const topFlavors = Array.from(flavorMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return {
      areaName: areaInfo.areaName,
      city: areaInfo.city,
      state: areaInfo.state,
      totalShops: Math.max(...Array.from(flavorMap.values()).map(f => f.shopCount)),
      totalRevenue: Array.from(flavorMap.values()).reduce((sum, f) => sum + f.totalRevenue, 0),
      topFlavors,
      lastUpdated: new Date().toISOString()
    };
  }

  // Get area recommendations for a shop
  getAreaRecommendations(currentArea: AreaInfo, allAreaAnalytics: AreaAnalytics[]): {
    similarAreas: AreaAnalytics[];
    topPerformingFlavors: FlavorPerformance[];
    marketInsights: string[];
  } {
    // Find similar areas (same city or nearby)
    const similarAreas = allAreaAnalytics.filter(area => 
      area.city === currentArea.city || 
      area.state === currentArea.state
    ).sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Get top performing flavors across similar areas
    const flavorMap = new Map<string, FlavorPerformance>();
    similarAreas.forEach(area => {
      area.topFlavors.forEach(flavor => {
        if (!flavorMap.has(flavor.flavorId)) {
          flavorMap.set(flavor.flavorId, { ...flavor });
        } else {
          const existing = flavorMap.get(flavor.flavorId)!;
          existing.totalSales += flavor.totalSales;
          existing.totalRevenue += flavor.totalRevenue;
          existing.shopCount += flavor.shopCount;
          existing.averagePrice = (existing.averagePrice + flavor.averagePrice) / 2;
        }
      });
    });

    const topPerformingFlavors = Array.from(flavorMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // Generate market insights
    const marketInsights: string[] = [];
    
    if (similarAreas.length > 0) {
      const avgRevenue = similarAreas.reduce((sum, area) => sum + area.totalRevenue, 0) / similarAreas.length;
      marketInsights.push(`Average revenue in similar areas: ₹${avgRevenue.toLocaleString()}`);
      
      const topFlavor = topPerformingFlavors[0];
      if (topFlavor) {
        marketInsights.push(`Top performing flavor: ${topFlavor.flavorName} (₹${topFlavor.averagePrice.toFixed(2)} avg price)`);
      }
      
      const totalShops = similarAreas.reduce((sum, area) => sum + area.totalShops, 0);
      marketInsights.push(`Total shops in similar areas: ${totalShops}`);
    }

    return {
      similarAreas: similarAreas.slice(0, 5),
      topPerformingFlavors,
      marketInsights
    };
  }
}

export const areaAnalyticsService = new AreaAnalyticsService();
export default areaAnalyticsService;
