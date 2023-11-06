// NPM Modules
import { Model } from 'objection';
import knex from 'knex';
import bCrypt from 'bcryptjs';
import { ErrorsUtil, CryptoUtil } from '../utils';

import knexConfigs from '../../knex.configs';

const pg = knex(knexConfigs.development);

const { InputValidationError } = ErrorsUtil;

class UsersModel extends Model {
  static get idColumn() { return 'id'; }

  static get tableName() { return 'users'; }

  $formatJson(json) {
    json = super.$formatJson(json);
    delete json.password;
    return json;
  }

  $beforeInsert() {
    const date = new Date();
    this.created_at = date;
  }

  $beforeUpdate() {
    const date = new Date();
    this.updated_at = date;
  }

  // Methods

  static async create(payload) {
    const user = await UsersModel.query().select('*').where('adminname', '=', payload.adminname);
    if (user.length === 0) {
      return UsersModel.query().insert(payload);
    }
    throw new InputValidationError('User with this adminname already exist');
  }

  static async edit(id, payload) {
    const user = await UsersModel.query()
      .select('password')
      .where('id', '=', id);
    if (payload.oldPassword && payload.newPassword) {
      if (!CryptoUtil.isValidPassword(payload.oldPassword, user[0].password)) {
        throw new InputValidationError('Invalid old password');
      }
      const newPassword = await bCrypt.hash(payload.newPassword, 10);
      delete payload.newPassword;
      delete payload.oldPassword;
      payload.password = newPassword;
    }
    return UsersModel.query()
      .update(payload)
      .where('id', '=', id)
      .returning('*');
  }

  static async findByUsersId(usersId) {
    const userArray = await UsersModel.query().select('*').where('users_id', '=', usersId);
    const user = userArray[0];
    return user;
  }

  static findByAdminName(adminname) {
    return UsersModel.query().findOne({ adminname });
  }

  static getAllUsers() {
    return UsersModel.query().select('*').where('role', '=', 'admin').orderBy('id');
  }

  static delete(id) {
    return UsersModel.query().del().where('id', '=', id).returning('*');
  }

  static async getCompanyDataWithLimit(category, companyName, limit) {
    return pg('products').select('*').where('product_status', '=', category)
      .where('companyName', '=', companyName)
      .orderBy('id', 'desc')
      .limit(limit);
  }
}

export default UsersModel;
