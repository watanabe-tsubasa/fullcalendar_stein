import React, { useCallback, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from "@fullcalendar/interaction";
import jaLocale from "@fullcalendar/core/locales/ja"
import dayjs from 'dayjs';

const now = new Date();

// サンプルの日付生成
// const addDay = new Date();
// addDay.setDate(addDay.getDate() + 2)
// const start = now.toISOString(); //new Date()から日付のみ取り出す
// const end = addDay.toISOString().split('T')[0];
// const eventName = end;

// steinでgoogle sheetから読み込み
const steinStore = require('stein-js-client')
const store  = new steinStore(process.env.STEIN_API_KEY)

// カレンダーコンポーネントの生成
const CalendarData = (props) => {
  const [events, setEvents] = useState();

  useEffect(() => {  
    store.read("シート1", { limit: 200, offset: 0 })  
       .then((data) => {
        console.dir(data);
        let eventList = data.map(element => {
          return {id: element.rowId, title: element.予約者, start:element.開始, end:element.終了, description:element.用途};
        });
        setEvents(eventList)
        });
  },[])

  //何もないところをクリックした時の処理を記述(handleSelectと重複するため削除)
  // const handleDateClick = useCallback((arg) => {
  //   console.log(arg);
  //   alert(arg.dateStr);
  // }, []);

  // イベントをクリックした時の処理を記述
  const handleEventClick = useCallback((arg) => {
    console.dir(arg);
    let id = arg.event._def.publicId;
    let title = arg.event._def.title;
    let description = arg.event._def.extendedProps.description
    // let start = arg.el.fcSeg.start;
    console.log(id)
    console.log(title);
    const result = window.confirm(`イベント内容: ${description} / イベントを削除しますか?`)
    if (result) {
      arg.event.remove();
      store.delete('シート1', 
        {search: {rowId: id, 予約者: title}}).then(data => {
          console.dir(data);
        });
    }
    // alert('削除しました');
  }, []);

  // イベントをドラッグ＆ドロップした時の処理を記述
  const handleEventDrop = useCallback((arg) => {
    console.log(arg);
    let start = arg.event._instance.range.start;
    let end = arg.event._instance.range.end;
    start = dayjs(start).add(-9, 'h').format();
    end = dayjs(end).add(-9, 'h').format();
    let id = arg.event._def.publicId;
    let title = arg.event._def.title;

    store.edit('シート1', {
      search: {rowId: id, 予約者:title},
      set:{開始: start , 終了: end}
    }).then(data => {
      console.log(data);
    });

    // alert('dropped');
  }, [])

  // イベントをリサイズした時の処理を記述
  const handleEventResize = useCallback((arg) =>{
    console.log(arg);
    let start = arg.event._instance.range.start;
    let end = arg.event._instance.range.end;
    start = dayjs(start).add(-9, 'h').format();
    end = dayjs(end).add(-9, 'h').format();
    let id = arg.event._def.publicId;
    let title = arg.event._def.title;

    store.edit('シート1', {
      search: {rowId: id, 予約者:title},
      set:{開始: start , 終了: end}
    }).then(data => {
      console.log(data);
    });
    // alert('resized')
  }, [])

  // イベントが設定されていない場所を選択(クリック・ドラッグ)した時の処理を記述
  const handleSelect = useCallback((arg) => {
    console.log(arg);
    let eventTitle = prompt('title');//タイトル入力
    let calendarApi = arg.view.calendar;
    calendarApi.unselect();
    if (eventTitle) {
      let id = Math.floor(Math.random() * 10000)
      let eventDesciption = prompt('description');
      calendarApi.addEvent({
        id: id,
        title:eventTitle,
        start: arg.startStr,
        end: arg.endStr,
        allDay: arg.allDay,
        backgroundColor: "red",
        borderColor: "red",
        description: eventDesciption
      });
      store.append('シート1', [
        {
          rowId: id,
          予約者: eventTitle,
          用途: eventDesciption,
          開始: arg.startStr,
          終了: arg.endStr
        }
      ]).then(data => {
        console.log(data)
      });
    }
    // alert(`
    // event:${eventTitle} 
    // start:${arg.startStr}
    // end:${arg.endStr}`);
  }, [])
  
  return (
    events ?
    <FullCalendar
      plugins={[
        dayGridPlugin,
        timeGridPlugin,
        listPlugin,
        interactionPlugin
      ]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title', 
        right: 'dayGridMonth,timeGridWeek',//timeGridDayで単日表示も可能,listWeekでリスト表示
      }}
      initialView="timeGridWeek"
      initialDate={now.toISOString().split('T')[0]}
      // contentHeight='auto'
      nowIndicator={true} //現在時刻の表示
      locales={[jaLocale]}  //todayとかも日本語化される
      locale="ja" // 日本語化
      selectable={true} //範囲指定が可能になる
      eventStartEditable={true} //ドラッグ&ドロップが可能になる
      eventDurationEditable={true} //期間変更

      //設定した各種イベント
      eventClick={handleEventClick}
      eventDrop={handleEventDrop}
      eventResize={handleEventResize}
      select={handleSelect}
      // dateClick={addArr} //selectと重複するため削除
      
     
      events={events
        //作業用のサンプルイベント　実装時にコメントアウトする
        // [
        //   { title: events[0].予約者, start:events[0].開始, end:events[0].終了},
        //   // endに指定した日付は含まないので注意
        //   // { title: data[0].予約者, start: "2022-07-24", end: "2022-07-26" },
        //   {
        //     title: "event 3",
        //     start: "2022-07-26T10:00:00",
        //     end: "2022-07-26T13:00:00" // 時間を指定するときはISO 8601の形式で。
        //   },
        // ]
      }
    /> : 
    <div><h1>読み込み中・・・ちょっと待ってね</h1></div>
  );
};
export default CalendarData;