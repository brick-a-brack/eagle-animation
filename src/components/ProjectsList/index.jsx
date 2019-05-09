import React, { Component } from 'react';
import { join } from 'path';
import PropTypes from 'prop-types';
import styles from './styles.module.css';
import { NEW_PROJECT, OPEN_PROJECT, UNTITLED_PROJECT } from '../../languages';
import { ReactComponent as IconEdit } from './assets/edit.svg';
import { ReactComponent as IconAdd } from './assets/add.svg';
import { ReactComponent as IconOpen } from './assets/open.svg';

class ProjectsList extends Component {
    constructor(props) {
        super(props);
        this.refInputNewName = React.createRef();
        this.renameTimeout = {};
    }

    _onRename(project, name) {
        const { onRename } = this.props;
        if (this.renameTimeout[project.path])
            clearTimeout(this.renameTimeout[project.path]);
        this.renameTimeout[project.path] = setTimeout(() => {
            onRename(project._path, name);
        }, 1500);
    }

    render() {
        const {
            onOpen, onCreate, onLoad, projects
        } = this.props;
        return (
            <div className={styles.wrapper}>
                <div className={styles.box}>
                    <div className={styles.banner}>
                        <img alt="" />
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        className={styles.bannerhover}
                        onClick={() => {
                            onCreate(this.refInputNewName.current.value);
                        }}
                        onKeyPress={() => {
                            onCreate(this.refInputNewName.current.value);
                        }}
                    >
                        <IconAdd />
                    </div>
                    <div className={styles.title}>
                        <input placeholder={NEW_PROJECT} ref={this.refInputNewName} />
                    </div>
                </div>
                <div className={styles.box}>
                    <div className={styles.banner}>
                        <img alt="" />
                    </div>
                    <div
                        role="button"
                        tabIndex={0}
                        className={styles.bannerhover}
                        onClick={() => {
                            onOpen();
                        }}
                        onKeyPress={() => {
                            onOpen();
                        }}
                    >
                        <IconOpen />
                    </div>
                    <div className={styles.title}>
                        <input readOnly placeholder={OPEN_PROJECT} />
                    </div>
                </div>

                {[...projects]
                    .sort((a, b) => b.project.updated - a.project.updated)
                    .map(e => (
                        <div className={styles.box} key={e._path}>
                            <div className={styles.banner}>
                                {e.project.scenes[0].pictures.length && (
                                    <img
                                        alt=""
                                        src={join(
                                            e._path,
                                            '/0/',
                                            e.project.scenes[0].pictures[0].filename
                                        )}
                                    />
                                )}
                            </div>
                            <div
                                role="button"
                                tabIndex={0}
                                className={styles.bannerhover}
                                onClick={() => {
                                    onLoad(e._path);
                                }}
                                onKeyPress={() => {
                                    onLoad(e._path);
                                }}
                            >
                                <IconEdit />
                            </div>
                            <div className={styles.title}>
                                <input
                                    placeholder={UNTITLED_PROJECT}
                                    defaultValue={e.project.title}
                                    onChange={(evt) => {
                                        this._onRename(e, evt.target.value);
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                {Array.apply(null, { length: 60 }) // eslint-disable-line prefer-spread
                    .map(Number.call, Number)
                    .map((_, key) => (
                        <div
                            key={`empty-${key}`} // eslint-disable-line react/no-array-index-key
                            className={`${styles.box} ${styles.empty}`}
                        />
                    ))}
            </div>
        );
    }
}

ProjectsList.propTypes = {
    projects: PropTypes.array.isRequired,
    onLoad: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired
};

export default ProjectsList;
