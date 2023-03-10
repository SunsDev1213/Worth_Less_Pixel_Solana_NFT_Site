import React, { useEffect } from "react";
import "dhtmlx-gantt";
import "./style/custom.css";
import "dhtmlx-gantt/codebase/ext/dhtmlxgantt_marker";
import "dhtmlx-gantt/codebase/skins/dhtmlxgantt_material.css";
import data from "./data/data";

declare var gantt: GanttStatic;

const GanttChart: React.FC = () => {
  useEffect(() => {
    gantt.config.xml_date = "%Y-%m-%d";
    gantt.config.server_utc = true;
    // gantt.config.smart_rendering = false;
    gantt.config.multiselect = true;
    gantt.config.readonly = true;
    gantt.config.min_column_width = 20;
    gantt.config.columns[0].width = 400;
    gantt.init("gantt");
  }, []);

  useEffect(() => {
    gantt.parse({
      data: data.data,
    });
    gantt.render();
  });

  return (
    <>
      <div style={{ width: "100%", height: "100%", position: "absolute" }}>
        <div id="gantt" />
      </div>
    </>
  );
};

export default GanttChart;
