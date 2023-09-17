import React, { useState, useEffect } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../../app/graphpage.css';

/**
 * APIから取得した都道府県データの型
 */
type Prefecture = {
  prefCode: number;
  prefName: string;
};

/**
 * APIから取得した人口データの型
 */
type Population = {
  label: string;
  data: {
    year: number;
    value: number;
    rate?: number;
  }[];
};

/**
 * 人口データと都道府県コードを格納する型
 */
type PopulationWithPref = {
  population: Population;
  prefCode: number;
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GraphPage: React.FC = () => {
  const [prefectures, setPrefectures] = useState<Prefecture[]>([]);
  const [selectedPrefectures, setSelectedPrefectures] = useState<number[]>([]);
  const [populationData, setPopulationData] = useState<PopulationWithPref[]>([]);

  /**
   * ページ描画時に、都道府県の一覧を取得する。
   */
  useEffect(() => {
    axios
      .get('https://opendata.resas-portal.go.jp/api/v1/prefectures', {
        headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_RESAS_API_KEY },
      })
      .then((response: AxiosResponse) => {
        setPrefectures(response.data.result);
      })
      .catch((error: AxiosError) => {
        console.error('Error fetching prefectures', error);
      });
  }, []);

  /**
   * 選択している都道府県が変わると、選択されている都道府県の人口データを取得する。
   */
  useEffect(() => {
    if (selectedPrefectures.length > 0) {
      for (const prefCode of selectedPrefectures) {
        axios
          .get('https://opendata.resas-portal.go.jp/api/v1/population/composition/perYear', {
            params: {
              prefCode: prefCode,
            },
            headers: { 'X-API-KEY': process.env.NEXT_PUBLIC_RESAS_API_KEY },
          })
          .then((response: AxiosResponse) => {
            const result = response.data.result.data[0];
            const data: PopulationWithPref = {
              population: result,
              prefCode: prefCode,
            };
            setPopulationData([...populationData, data]);
          })
          .catch((error: AxiosError) => {
            console.error('Error fetching population data', error);
          });
      }
    }
  }, [selectedPrefectures]);

  /**
   * チェックボックスの値が変更された時に走る処理。
   * @param event チェックボックスの値の変更イベント
   */
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (event.target.checked) {
      setSelectedPrefectures([...selectedPrefectures, value]);
    } else {
      setSelectedPrefectures(selectedPrefectures.filter((prefCode) => prefCode !== value));
    }
  };

  /**
   * グラフとして描画するデータの設定。
   * グラフの色は都道府県コードをもとに16進数カラーコードを設定。
   */
  const chartData = {
    labels: [1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020],
    datasets: selectedPrefectures.map((prefCode) => {
      const prefName = prefectures.find((pref) => pref.prefCode === prefCode)?.prefName || '';
      const data = populationData.find((population) => population.prefCode === prefCode)?.population.data || [];
      return {
        label: prefName,
        data: data.map((item) => item.value),
        borderColor: `#${Math.floor(prefCode * 0.01 * 16777215).toString(16)}`,
      };
    }),
  };

  // Chart.jsのオプション設定
  const chartOptions = {
    scales: {
      x: {
        title: {
          display: true,
          text: '年度',
        },
      },
      y: {
        title: {
          display: true,
          text: '人口数',
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div>
      <h1>都道府県選択</h1>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap', // flexWrapでWrapを指定して要素を折り返すようにする。
        }}
      >
        {prefectures.map((pref) => (
          <label key={pref.prefCode} className='checkbox-label'>
            <input
              type='checkbox'
              value={pref.prefCode}
              checked={selectedPrefectures.includes(pref.prefCode)}
              onChange={handleCheckboxChange}
            />
            <span className='checkbox-text'>{pref.prefName}</span>
          </label>
        ))}
      </div>
      <div className='.wrap-chart'>
        <div className='chart-container'>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default GraphPage;
