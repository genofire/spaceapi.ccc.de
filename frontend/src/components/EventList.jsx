import React from 'react';
import { connect } from 'react-redux';
import TableCell from '@material-ui/core/TableCell';
import PropTypes from 'prop-types';
import InfoIcon from '@material-ui/icons/InfoOutlined';
import { actions as calendarActions, eventStruct } from '../redux/modules/calendar';
import {actions as spaceDataActions, spacedataStruct} from '../redux/modules/spacedata';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { AutoSizer, Column, Table } from 'react-virtualized';

const styles = theme => ({
  table: {
    fontFamily: theme.typography.fontFamily,
    border: 0,
  },
  flexContainer: {
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  tableRow: {},
  tableRowHover: {
    '&:hover': {
      backgroundColor: theme.palette.grey[600],
    },
  },
  tableRowEven: {
    backgroundColor: theme.palette.grey[700],
  },
  tableCell: {
    flex: 1,
    color: '#fff',
    border: 0,
  },
  noClick: {
    cursor: 'initial',
  },
});

class MuiVirtualizedTable extends React.PureComponent {
  getRowClassName = ({ index }) => {
    const { classes, rowClassName } = this.props;

    return classNames(classes.tableRow, classes.flexContainer, rowClassName, {
      [classes.tableRowHover]: index !== -1,
      [classes.tableRowEven]: index % 2,
    });
  };

  cellRenderer = ({ cellData, columnIndex = null }) => {
    const { columns, classes, rowHeight, onRowClick } = this.props;
    return (
      <TableCell
        component="div"
        className={classNames(classes.tableCell, classes.flexContainer, {
          [classes.noClick]: onRowClick == null,
        })}
        variant="body"
        style={{ height: rowHeight }}
        align={(columnIndex != null && columns[columnIndex].numeric) || false ? 'right' : 'left'}
      >
        {cellData}
      </TableCell>
    );
  };

  render() {
    const { classes, columns, ...tableProps } = this.props;
    return (
      <AutoSizer>
        {({ height, width }) => (
          <Table
            className={classes.table}
            height={height}
            width={width}
            {...tableProps}
            rowClassName={this.getRowClassName}
          >
            {columns.map(({ cellContentRenderer = null, className, dataKey, ...other }, index) => {
              let renderer;
              if (cellContentRenderer != null) {
                renderer = cellRendererProps =>
                  this.cellRenderer({
                    cellData: cellContentRenderer(cellRendererProps),
                    columnIndex: index,
                  });
              } else {
                renderer = this.cellRenderer;
              }

              return (
                <Column
                  key={dataKey}
                  headerRenderer={() => {}}
                  className={classNames(classes.flexContainer, className)}
                  cellRenderer={renderer}
                  dataKey={dataKey}
                  {...other}
                />
              );
            })}
          </Table>
        )}
      </AutoSizer>
    );
  }
}

MuiVirtualizedTable.propTypes = {
  classes: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      cellContentRenderer: PropTypes.func,
      dataKey: PropTypes.string.isRequired,
      width: PropTypes.number.isRequired,
    }),
  ).isRequired,
  headerHeight: PropTypes.number,
  onRowClick: PropTypes.func,
  rowClassName: PropTypes.string,
  rowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  sort: PropTypes.func,
};

MuiVirtualizedTable.defaultProps = {
  rowHeight: 40,
  headerHeight: 0,
};

const WrappedVirtualizedTable = withStyles(styles)(MuiVirtualizedTable);

const mapStateToProps = state => ({
  events: state.calendars.items,
  spacedata: state.spacedata,
});

const mapDispatchToProps = {
  ...calendarActions,
  ...spaceDataActions,
};


class EventList extends React.Component {
  static propTypes = {
    events: PropTypes.arrayOf(
      PropTypes.shape(eventStruct),
    ),
    fetchCalendars: PropTypes.func,
    spacedata: spacedataStruct,
  };

  static defaultProps = {
    events: [],
  };

  componentWillMount() {
    this.props.fetchCalendars();
  }

  formatDate = date => (date.format('DD.MM.YYYY'));
  formatTime = date => (date.format('HH:mm'));

  render() {

    const rows = this.props.events.filter(event =>
      (
        this.props.spacedata.filter.indexOf(event.space) !== -1
        || this.props.spacedata.filter.length === 0
      )
    ).map(event => {
      return {
        ...event,
        start_date: this.formatDate(event.start),
        start_time: this.formatTime(event.start),
        summary: event.summary || event.description,
        link: event.url && <a href={event.url}>
          <InfoIcon style={{ cursor: 'pointer', color: '#fff' }} />
        </a>,
      }
    });

    return (
      <WrappedVirtualizedTable
        rowCount={rows.length}
        rowGetter={({ index }) => rows[index]}
        columns={[
          {
            width: 120,
            label: 'Date',
            dataKey: 'start_date',
          },
          {
            width: 120,
            label: 'Time',
            dataKey: 'start_time',
          },
          {
            width: 120,
            flexGrow: 1,
            label: 'Summary',
            dataKey: 'summary',
          },
          {
            width: 120,
            flexGrow: 1,
            label: 'Carbs (g)',
            dataKey: 'space',
          },
          {
            width: 120,
            label: 'Protein (g)',
            dataKey: 'link',
          },
        ]}
      />
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(EventList);
