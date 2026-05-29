package net.axcira

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.v1.jdbc.Query


@Serializable
data class Pagination(val limit: Int = 10, val offset: Int = 0)

/**
 * 配列を指定されたページネーション設定に基づいてスライスします。
 *
 * @param pagination ページネーション情報を含むオブジェクト。
 *                   このオブジェクトの `offset` はスライスの開始インデックスを、
 *                   `limit` は取得する要素数を示します。
 * @return ページネーション設定に従って切り取られた新しい配列。
 */
fun <T> Array<T>.paginate(pagination: Pagination) = slice(pagination.offset until pagination.offset + pagination.limit)

/**
 * Queryオブジェクトにページネーション設定を適用します。
 *
 * @param pagination ページネーション情報を含むオブジェクト。
 *                   このオブジェクトの `offset` はスライスの開始インデックスを、
 *                   `limit` は取得する要素数を示します。
 * @return 適用されたQueryオブジェクト。
 */
fun Query.paginate(pagination: Pagination) = this.offset(pagination.offset.toLong()).limit(pagination.limit)
